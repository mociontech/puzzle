// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import {
  createUserWithEmailAndPassword,
  getAuth,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import {
  Firestore,
  collection,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  onSnapshot,
  query,
  setDoc,
  where,
} from "firebase/firestore";
import { log } from "../utils/tools";
import { getDownloadURL, getStorage, ref, uploadBytes } from "firebase/storage";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDAg8fcs_rBQlB7xCxGm1Xq-1X9ISe-stY",
  authDomain: "multirepos.firebaseapp.com",
  projectId: "multirepos",
  storageBucket: "multirepos.appspot.com",
  messagingSenderId: "543787682717",
  appId: "1:543787682717:web:68309224639c36ee787d74",
  measurementId: "G-7D3MCCEZMR",
};

// Initialize Firebase ------------------------------------------------------
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const error = (e) => log(e);
const ok = () => log("ok");

// firebase auth ------------------------------------------------------------
export const authListener = (setUser) => {
  auth.onAuthStateChanged(async (user) => {
    if (user) {
      let token = await user.getIdToken();
      setUser({ email: user.email, token });
    } else setUser(null);
  });
};

export const closeAccount = () => signOut(auth).then(ok).catch(error);

export const signIn = async (data, pass, setError, createUser) => {
  const err = (e) => setError("Hubo un problema, revisa tus datos");
  const yes = () => setError("");
  createUser && (await setUserInfo(data));
  const method = createUser
    ? createUserWithEmailAndPassword
    : signInWithEmailAndPassword;
  method(auth, data.email, pass).then(yes).catch(err);
};

// firebase storage ---------------------------------------------------------
const storage = getStorage();
// Create a storage reference from our storage service
export const storageRef = ref(storage, "mirror/mirror.jpeg");
export const getUrl = (fullPath, setter) =>
  getDownloadURL(ref(storage, fullPath)).then((url) => setter(url));

export const sendImageToStorage = (file, callback) => {
  const path = `dalle2/${file.name}`
  const metadata = { contentType: 'image/png' };

  uploadBytes(ref(storage, path), file, metadata).then((snapshot) => {
    getDownloadURL(snapshot.ref).then((downloadURL) => {
      callback(downloadURL)
    });
  })
};

// firebase firestore -------------------------------------------------------
export const getUserInfo = (email, setter) =>
  onSnapshot(doc(db, "userInfo", email), (doc) => setter(doc.data()));

export const setUserInfo = async (data) =>
  await setDoc(doc(db, "userInfo", data.email), data, { merge: true });

export const setQr = async (data) =>
  await setDoc(doc(db, "qr", data.code), data, { merge: true });

export const setNewUser = async (col, data, id) =>
  await setDoc(doc(db, col, id), data, { merge: true });

export const getRoomscape = (setter) =>
  onSnapshot(doc(db, "configuration", "scaperoom"), (doc) =>
    setter(doc.data())
  );

export const setData = (data) =>
  setDoc(doc(db, "configuration", "scaperoom"), data, { merge: true });

export const setDataSunset = (data) =>
  setDoc(doc(db, "DBOrbia2023", data.email), data, { merge: true });
  
export const existOrbiaByEmail = async(email) =>{
  const data = await getDoc(doc(db, "DBOrbia2023", email))
  return data.exists()
}

export const getDataSunset = (email, setData) => {
  getDoc(doc(db, "DBCoronaSunset", email)).then(function (doc) {
    doc.exists() && setData(doc.data())
  }).catch(function (error) {
    console.error("Error al comprobar el documento:", error);
  });
}

export const getDataFromFirebase = async (setter, col) => {
  const list = [];
  const colRef = collection(db, col)
  const q = query(colRef, where("timestamp", ">", new Date("2023-04-23 5:00")))
  const docs = await getDocs(colRef);
  docs.forEach((doc) => {
    const data = doc.data()
    Object.keys(data).forEach((key) => typeof data[key] === "object" && (data[key] = data[key].toString()))
    list.push(data)
  });
  setter(list);
};
