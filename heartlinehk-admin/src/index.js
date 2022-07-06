import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
//import App from './App';
import NewApp from './NewApp';
import { initializeApp } from 'firebase/app';
import { getDatabase, connectDatabaseEmulator } from 'firebase/database';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions';

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


const app = initializeApp(firebaseConfig);


if (window.location.hostname === "localhost"){
  connectDatabaseEmulator(getDatabase(), "localhost", 9000);
  connectAuthEmulator(getAuth(), "http://localhost:9099");
  connectFunctionsEmulator(getFunctions(), "localhost", 5001);
}



ReactDOM.render(
  <React.StrictMode>
    <NewApp />
  </React.StrictMode>,
  document.getElementById('root')
);


