import {initializeApp} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
    getAuth,
    GoogleAuthProvider,
    signInWithPopup
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const firebaseConfig = {
    apiKey: "AIzaSyCUKsrzv9peQXAH11mkBA7KIXBeIi1OpR0",
    authDomain: "idle-system.firebaseapp.com",
    projectId: "idle-system",
    storageBucket: "idle-system.firebasestorage.app",
    messagingSenderId: "994102932330",
    appId: "1:994102932330:web:5a77e35f1283e036a12b13",
    measurementId: "G-M3GGGV5RHX"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

window.firebaseLoginWithInfo = async function () {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    const token = await result.user.getIdToken();

    return {
        Uid: result.user.uid,
        DisplayName: result.user.displayName,
        AccessToken: token
    };
};
