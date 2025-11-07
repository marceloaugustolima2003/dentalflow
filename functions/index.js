const admin = require('firebase-admin');
const functions = require('firebase-functions');
const express = require('express');
const stripe = require('stripe')(functions.config().stripe.secret);

admin.initializeApp();

const app = express();

app.post('/create-checkout-session', async (req, res) => {
    const { uid } = req.body;
    if (!uid) {
        return res.status(400).send({ error: 'UID do usuário é obrigatório.' });
    }

    try {
        const user = await admin.auth().getUser(uid);
        const db = admin.firestore();
        const userRef = db.collection('users').doc(uid);
        const userDoc = await userRef.get();
        let stripeCustomerId = userDoc.data()?.stripeCustomerId;

        if (!stripeCustomerId) {
            const customer = await stripe.customers.create({
                email: user.email,
                metadata: { firebaseUID: uid },
            });
            stripeCustomerId = customer.id;
            await userRef.set({ stripeCustomerId }, { merge: true });
        }

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            customer: stripeCustomerId,
            line_items: [{
                price: functions.config().stripe.price_id,
                quantity: 1,
            }],
            mode: 'subscription',
            subscription_data: { trial_period_days: 7 },
            success_url: `${functions.config().stripe.success_url}`,
            cancel_url: `${functions.config().stripe.cancel_url}`,
            metadata: { firebaseUID: uid }
        });

        res.send({ id: session.id });
    } catch (error) {
        console.error("Erro ao criar sessão de checkout do Stripe:", error);
        res.status(500).send({ error: 'Não foi possível criar a sessão de checkout.' });
    }
});

const endpointSecret = functions.config().stripe.webhook_secret;

app.post('/stripe-webhook', express.raw({type: 'application/json'}), async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
        event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    } catch (err) {
        console.error('⚠️  Webhook signature verification failed.', err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    const data = event.data.object;
    const eventType = event.type;

    let uid;

    if (eventType === 'checkout.session.completed') {
        uid = data.metadata.firebaseUID;
    } else {
        const customer = await stripe.customers.retrieve(data.customer);
        uid = customer.metadata.firebaseUID;
    }

    if (!uid) {
        console.error('UID do Firebase não encontrado nos metadados do Stripe.');
        return res.status(400).send('UID não encontrado.');
    }

    const db = admin.firestore();
    const userRef = db.collection('users').doc(uid);

    switch (eventType) {
        case 'checkout.session.completed':
        case 'customer.subscription.updated':
            const subscription = await stripe.subscriptions.retrieve(data.subscription || data.id);
            const status = subscription.status;
            const isActive = status === 'trialing' || status === 'active';

            await admin.auth().setCustomUserClaims(uid, { activeSubscription: isActive });
            await userRef.set({
                stripeCustomerId: data.customer,
                subscriptionStatus: status,
            }, { merge: true });

            break;
        case 'customer.subscription.deleted':
        case 'invoice.payment_failed':
            await admin.auth().setCustomUserClaims(uid, { activeSubscription: false });
            await userRef.set({ subscriptionStatus: data.status || 'canceled' }, { merge: true });
            break;
        default:
            console.log(`Unhandled event type ${eventType}`);
    }

    res.status(200).send();
});

app.post('/create-portal-session', async (req, res) => {
    const { uid } = req.body;
    if (!uid) {
        return res.status(400).send({ error: 'UID do usuário é obrigatório.' });
    }

    try {
        const db = admin.firestore();
        const userRef = db.collection('users').doc(uid);
        const userDoc = await userRef.get();
        const stripeCustomerId = userDoc.data()?.stripeCustomerId;

        if (!stripeCustomerId) {
            return res.status(404).send({ error: 'Cliente Stripe não encontrado para este usuário.' });
        }

        const portalSession = await stripe.billingPortal.sessions.create({
            customer: stripeCustomerId,
            return_url: `${functions.config().stripe.return_url}`,
        });

        res.send({ url: portalSession.url });
    } catch (error) {
        console.error("Erro ao criar sessão do Portal do Cliente:", error);
        res.status(500).send({ error: 'Não foi possível criar a sessão do portal.' });
    }
});

exports.api = functions.https.onRequest(app);

exports.getPublishableKey = functions.https.onCall((data, context) => {
    return {
        publishableKey: functions.config().stripe.publishable_key
    };
});

exports.setAdminRole = functions.https.onCall(async (data, context) => {
    // Optional: Add a check to ensure the caller is an admin
    if (context.auth.token.role !== 'admin') {
        return { error: 'Only admins can set admin roles.' };
    }

    const { uid } = data;
    if (!uid) {
        return { error: 'UID do usuário é obrigatório.' };
    }

    try {
        await admin.auth().setCustomUserClaims(uid, { role: 'admin' });
        return { message: `Sucesso! O usuário ${uid} agora é um administrador.` };
    } catch (error) {
        console.error("Erro ao definir role de admin:", error);
        return { error: 'Não foi possível definir a role de administrador.' };
    }
});