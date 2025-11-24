import { auth } from "./firebase-init.js";
import { signInWithEmailAndPassword, sendPasswordResetEmail, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";

const authForm = document.getElementById('auth-form');
const emailInput = document.getElementById('email-input');
const passwordInput = document.getElementById('password-input');
const authButton = document.getElementById('auth-button');
const authErrorMessage = document.getElementById('auth-error-message');
const passwordResetButton = document.getElementById('password-reset-button');

// Loading Helper
const setButtonLoading = (button, isLoading, originalText = null) => {
    if (isLoading) {
        button.disabled = true;
        if (originalText) button.dataset.originalText = originalText;
        button.innerHTML = `<svg class="animate-spin h-5 w-5 text-white mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>`;
    } else {
        button.disabled = false;
        button.innerHTML = button.dataset.originalText || 'Entrar';
    }
};

// Check if already logged in
onAuthStateChanged(auth, (user) => {
    if (user) {
        window.location.href = "index.html";
    }
});

// Login Logic
authForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = emailInput.value;
    const password = passwordInput.value;

    authErrorMessage.classList.add('hidden');
    setButtonLoading(authButton, true, 'Entrar');

    try {
        await signInWithEmailAndPassword(auth, email, password);
        // Redirect handled by onAuthStateChanged
    } catch (error) {
        let message = "Ocorreu um erro. Tente novamente.";
        if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') message = "Palavra-passe ou e-mail incorreto.";
        if (error.code === 'auth/user-not-found') message = "Utilizador não encontrado.";
        if (error.code === 'auth/too-many-requests') message = "Muitas tentativas. Tente novamente mais tarde.";

        authErrorMessage.textContent = message;
        authErrorMessage.classList.remove('hidden');
        setButtonLoading(authButton, false);
    }
});

// Password Reset Logic
passwordResetButton.addEventListener('click', async () => {
    const email = emailInput.value;
    if (!email) {
        authErrorMessage.textContent = "Por favor, insira o seu e-mail no campo acima para recuperar a senha.";
        authErrorMessage.classList.remove('hidden');
        authErrorMessage.classList.remove('text-red-500');
        authErrorMessage.classList.add('text-yellow-400'); // Warning color
        return;
    }

    try {
        await sendPasswordResetEmail(auth, email);
        authErrorMessage.textContent = "E-mail de recuperação enviado com sucesso!";
        authErrorMessage.classList.remove('hidden');
        authErrorMessage.classList.remove('text-red-500');
        authErrorMessage.classList.add('text-green-500'); // Success color
    } catch (error) {
        authErrorMessage.textContent = "Não foi possível enviar o e-mail de recuperação. Verifique o e-mail.";
        authErrorMessage.classList.remove('hidden');
        authErrorMessage.classList.remove('text-yellow-400');
        authErrorMessage.classList.remove('text-green-500');
        authErrorMessage.classList.add('text-red-500');
    }
});
