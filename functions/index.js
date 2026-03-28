const functions = require("firebase-functions");
const admin = require("firebase-admin");
const stripe = require("stripe")(functions.config().stripe.secret);

admin.initializeApp();

exports.createStripeCheckout = functions.https.onCall(async (data, context) => {
    // Check if the user is authenticated
    if (!context.auth) {
        throw new functions.https.HttpsError(
            "unauthenticated",
            "O usuário precisa estar logado para assinar."
        );
    }

    const userId = context.auth.uid;
    const email = data.email || context.auth.token.email;

    try {
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ["card"],
            mode: "subscription",
            customer_email: email,
            client_reference_id: userId,
            line_items: [
                {
                    // This price ID should be configured in your Stripe Dashboard and set as a Firebase Config var
                    price: functions.config().stripe.price_id,
                    quantity: 1,
                },
            ],
            // Redirect URLs after successful/canceled payment
            success_url: "https://cad-manager-d7eaf.web.app/?session_id={CHECKOUT_SESSION_ID}", // Adjust domain
            cancel_url: "https://cad-manager-d7eaf.web.app/", // Adjust domain
        });

        return { url: session.url };
    } catch (error) {
        console.error("Erro ao criar sessão no Stripe:", error);
        throw new functions.https.HttpsError(
            "internal",
            "Não foi possível criar a sessão de pagamento."
        );
    }
});

exports.stripeWebhook = functions.https.onRequest(async (req, res) => {
    const sig = req.headers["stripe-signature"];
    const endpointSecret = functions.config().stripe.webhook_secret;

    let event;

    try {
        event = stripe.webhooks.constructEvent(req.rawBody, sig, endpointSecret);
    } catch (err) {
        console.error("Webhook signature verification failed.", err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the checkout.session.completed event
    if (event.type === "checkout.session.completed") {
        const session = event.data.object;

        // Fulfill the purchase...
        const userId = session.client_reference_id;

        if (userId) {
            try {
                await admin.firestore().collection("users").doc(userId).set({
                    subscriptionStatus: "active",
                    stripeCustomerId: session.customer,
                    stripeSubscriptionId: session.subscription,
                }, { merge: true });
                console.log(`Assinatura ativada para o usuário: ${userId}`);
            } catch (error) {
                console.error("Erro ao atualizar o Firestore:", error);
                return res.status(500).send("Erro interno ao atualizar usuário.");
            }
        } else {
             console.error("Sem client_reference_id na sessão do Stripe.");
        }
    }

    // Return a 200 response to acknowledge receipt of the event
    res.status(200).send("Webhook recebido.");
});
