// Import SDKs do Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-storage.js";
import { getFunctions } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-functions.js";

const firebaseConfig = {
    apiKey: "AIzaSyDEDzQkvYegnFT2EK7RI_xZxconQ3-Q9GU",
    authDomain: "cad-manager-d7eaf.firebaseapp.com",
    projectId: "cad-manager-d7eaf",
    storageBucket: "cad-manager-d7eaf.appspot.com",
    messagingSenderId: "631779304741",
    appId: "1:631779304741:web:57c388a39cbe1ec32766cc"
};

let app, auth, db, storage, functions;

try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);
    functions = getFunctions(app, 'southamerica-east1');
} catch (error) {
    console.error("Erro ao inicializar o Firebase:", error);
}

export { app, auth, db, storage, functions };
