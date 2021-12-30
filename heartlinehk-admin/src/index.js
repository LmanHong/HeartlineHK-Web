import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import firebase from 'firebase/compat/app';
import 'firebase/compat/database';
import 'firebase/compat/auth';
import 'firebase/compat/functions';

var firebaseConfig = {
  apiKey: "AIzaSyD-gB_LHwUq2qiUXdDt2CAxGCYQQla4hMo",
  authDomain: "heartlinehk-8e3ec.firebaseapp.com",
  databaseURL: "https://heartlinehk-8e3ec-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "heartlinehk-8e3ec",
  storageBucket: "heartlinehk-8e3ec.appspot.com",
  messagingSenderId: "1077537941035",
  appId: "1:1077537941035:web:f5b566fde9a2363a2d6c6e",
  measurementId: "G-S9JD41562T"
};


firebase.initializeApp(firebaseConfig);

firebase.database().useEmulator("localhost", 9000);
firebase.auth().useEmulator("http://localhost:9099");
firebase.functions().useEmulator("localhost", 5001);


ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById('root')
);


