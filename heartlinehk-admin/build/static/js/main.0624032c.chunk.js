(this["webpackJsonpheartlinehk-admin"]=this["webpackJsonpheartlinehk-admin"]||[]).push([[0],{34:function(e,t,a){},36:function(e,t,a){},42:function(e,t,a){},47:function(e,t,a){},48:function(e,t,a){},49:function(e,t,a){"use strict";a.r(t);var n=a(2),r=a.n(n),s=a(28),c=a.n(s),i=(a(34),a(7)),l=a.n(i),o=a(14),u=a(8),d=a(18),b=a(5),h=a.p+"static/media/logo_80x80.6314ce1a.png",m=(a(36),a(1)),j=function(e){return Object(m.jsxs)("nav",{children:[Object(m.jsxs)("a",{href:"#",className:"nav-logo",children:[Object(m.jsx)("img",{src:h,alt:h,className:"front"}),Object(m.jsx)("p",{className:"nav-name",children:"HEARTLINEHK"})]}),Object(m.jsxs)("ul",{className:"nav-items-container",children:[Object(m.jsx)("li",{className:"nav-item",children:Object(m.jsxs)(d.b,{to:"/",className:"nav-link",children:[Object(m.jsx)("span",{className:"material-icons",children:"home"})," Dashboard"]})}),Object(m.jsx)("li",{className:"nav-item",children:Object(m.jsxs)(d.b,{to:"/chatroom",className:"nav-link",children:[Object(m.jsx)("span",{className:"material-icons",children:"chat"})," Chatroom"]})})]}),Object(m.jsxs)("div",{className:"nav-user",children:[Object(m.jsx)("img",{src:"https://t4.ftcdn.net/jpg/02/34/61/79/360_F_234617921_p1AGQkGyEl8CSzwuUI74ljn6IZXqMUf2.jpg",alt:""}),Object(m.jsx)("a",{href:"",className:"username",onClick:e.handleLogout,children:e.currentUser.displayName})]})]})},f=(a(42),a(11)),p=(a(22),a(27),function(e){var t=Object(n.useState)(f.a.database().ref("chat_queue")),a=Object(u.a)(t,2),r=a[0],s=(a[1],Object(n.useState)(f.a.database().ref("room_assigned"))),c=Object(u.a)(s,2),i=c[0],d=(c[1],Object(n.useState)(f.a.database().ref("chat_log/".concat(e.currentUser.uid)))),b=Object(u.a)(d,2),h=b[0],j=(b[1],Object(n.useState)([])),p=Object(u.a)(j,2),x=p[0],v=p[1],g=Object(n.useState)(localStorage.getItem("heartlinehk-currentClient")),O=Object(u.a)(g,2),k=O[0],w=O[1],y=Object(n.useState)([]),C=Object(u.a)(y,2),N=C[0],E=C[1],S=Object(n.useState)(!1),I=Object(u.a)(S,2),R=I[0],A=I[1],U=Object(n.useState)(!1),B=Object(u.a)(U,2),L=B[0],M=B[1],q=Object(n.useState)(!1),T=Object(u.a)(q,2),_=T[0],D=T[1],Q=function(e){var t=[];if(console.log(e.val()),null!=e.val())for(var a in e.val())t.push({chatId:a,uid:e.val()[a].uid,time:e.val()[a].time,msg:e.val()[a].msg,spc:e.val()[a].spc});console.log(t),E(t)},H=function(e){var t=[];if(console.log(e.val()),null!=e.val())for(var a in e.val())if(0==t.length)t.push({userId:a,status:e.val()[a].status,time:e.val()[a].time});else for(var n in t){if(t[n].time>=e.val()[a].time){t.splice(n,0,{userId:a,status:e.val()[a].status,time:e.val()[a].time});break}if(n===t.length-1){t.push({userId:a,status:e.val()[a].status,time:e.val()[a].time});break}}console.log(t),v(t)},P=function(){var t=Object(o.a)(l.a.mark((function t(a){var n,s,c,o,u,d,b;return l.a.wrap((function(t){for(;;)switch(t.prev=t.next){case 0:if(n=0,s=null,c=null,t.prev=3,!R){t.next=6;break}throw new Error("Already starting a new chat!");case 6:if(A(!0),r){t.next=12;break}throw A(!1),new ReferenceError("Chat Queue reference not available!");case 12:if(i){t.next=17;break}throw A(!1),new ReferenceError("Room Assigned reference not available!");case 17:if(h){t.next=22;break}throw A(!1),new ReferenceError("Chat Room reference not available!");case 22:if(null==k){t.next=27;break}throw A(!1),new Error("CurrentClient is already set!");case 27:t.t0=l.a.keys(x);case 28:if((t.t1=t.t0()).done){t.next=36;break}if(o=t.t1.value,"inQueue"!==x[o].status){t.next=34;break}return s=x[o].userId,c=x[o].time,t.abrupt("break",36);case 34:t.next=28;break;case 36:if(null!==s){t.next=38;break}throw new RangeError("No available client in chat queue!");case 38:return u=r.child(s),t.next=41,u.set({status:"roomAssigned",time:f.a.database.ServerValue.TIMESTAMP});case 41:return n+=1,d=i.child(s),t.next=45,d.set(e.currentUser.uid);case 45:return n+=1,t.next=48,h.push();case 48:return b=t.sent,t.next=51,b.set({uid:e.currentUser.uid,time:f.a.database.ServerValue.TIMESTAMP,spc:s});case 51:n+=1,localStorage.setItem("heartlinehk-clientId",s),w(s),A(!1);case 55:t.next=67;break;case 57:if(t.prev=57,t.t2=t.catch(3),console.error("ERROR: "+t.t2.message),!(n>=1)){t.next=63;break}return t.next=63,r.child(s).set({status:"inQueue",time:c});case 63:if(!(n>=2)){t.next=66;break}return t.next=66,i.child(s).remove();case 66:n>=3&&(localStorage.setItem("heartlinehk-currentClient",s),w(s));case 67:case"end":return t.stop()}}),t,null,[[3,57]])})));return function(e){return t.apply(this,arguments)}}(),F=function(){var t=Object(o.a)(l.a.mark((function t(a){var n,r,s,c,o,u;return l.a.wrap((function(t){for(;;)switch(t.prev=t.next){case 0:if(n=0,r=!1,t.prev=2,!L){t.next=5;break}throw new Error("Already ending a chat!");case 5:if(M(!0),i){t.next=11;break}throw M(!1),new ReferenceError("Room Assigned reference not available!");case 11:if(h){t.next=16;break}throw M(!1),new ReferenceError("Chat Room reference not available!");case 16:if(null!=k){t.next=21;break}throw M(!1),new Error("Current Client is null!");case 21:return t.next=23,i.child(k).once("value");case 23:s=t.sent,c=null===s.val(),o=!1,t.t0=l.a.keys(N);case 27:if((t.t1=t.t0()).done){t.next=34;break}if(u=t.t1.value,"clientLeft"!==N[u].spc){t.next=32;break}return o=!0,t.abrupt("break",34);case 32:t.next=27;break;case 34:if(n+=1,r=c||o){t.next=39;break}return t.next=39,i.child(k).set("volunLeft");case 39:return n+=1,t.next=42,h.remove();case 42:E([]),n+=1,localStorage.removeItem("heartlinehk-currentClient"),w(null),M(!1);case 47:t.next=57;break;case 49:if(t.prev=49,t.t2=t.catch(2),console.error("ERROR: "+t.t2.message),!(n>=2)){t.next=56;break}if(r){t.next=56;break}return t.next=56,i.child(k).set(e.currentUser.uid);case 56:n>=3&&(localStorage.removeItem("heartlinehk-currentClient"),w(null));case 57:case"end":return t.stop()}}),t,null,[[2,49]])})));return function(e){return t.apply(this,arguments)}}(),G=function(){var t=Object(o.a)(l.a.mark((function t(a){var n,r;return l.a.wrap((function(t){for(;;)switch(t.prev=t.next){case 0:if(t.prev=0,!_){t.next=3;break}throw new Error("Already sending a message!");case 3:if(D(!0),null!==k){t.next=7;break}throw D(!1),new Error("Current Client is null!");case 7:if(null!=(n=document.getElementById("msg-input").value)&&""!=n){t.next=13;break}throw D(!1),new Error("Message to be sent is empty!");case 13:if(h){t.next=18;break}throw D(!1),new ReferenceError("Chatroom reference not available!");case 18:return t.next=20,h.push();case 20:return r=t.sent,t.next=23,r.set({uid:e.currentUser.uid,time:f.a.database.ServerValue.TIMESTAMP,msg:n});case 23:document.getElementById("msg-input").value="",console.log("Message sent!"),D(!1);case 26:t.next=31;break;case 28:t.prev=28,t.t0=t.catch(0),console.error("ERROR: "+t.t0.message);case 31:case"end":return t.stop()}}),t,null,[[0,28]])})));return function(e){return t.apply(this,arguments)}}();return Object(n.useEffect)((function(){return console.log("Chatroom mounted!"),r&&r.orderByChild("time").on("value",H),h&&h.orderByChild("time").on("value",Q),function(){console.log("Chatroom Unmounted!"),r&&r.orderByChild("time").off("value",H),h&&h.orderByChild("time").off("value",Q)}}),[r,h]),Object(m.jsxs)("div",{className:"chatroom",children:[Object(m.jsxs)("div",{className:"chat-container",children:[Object(m.jsx)("div",{className:"messages-container",children:N.map((function(t,a){return Object(m.jsxs)("p",{className:"message "+(t.uid===e.currentUser.uid?"right":"left"),children:[t.msg?t.msg:t.spc?t.spc:"No message",Object(m.jsx)("span",{children:t.time})]},t.chatId)}))}),Object(m.jsxs)("div",{className:"input-container",children:[Object(m.jsx)("input",{type:"text",name:"msg-input",id:"msg-input",placeholder:"\u6309\u6b64\u5c0d\u8a71\u2026"}),Object(m.jsx)("button",{type:"submit",name:"submit-btn",id:"submit-btn",onClick:G,children:Object(m.jsx)("span",{className:"material-icons",children:"send"})})]})]}),Object(m.jsxs)("div",{className:"queue-container",children:[Object(m.jsxs)("p",{className:"main-text",children:["Queue Count: ",Object(m.jsx)("span",{className:"queue-count",children:x.length})]}),Object(m.jsx)("div",{className:"clients-container",children:x.map((function(e,t){return Object(m.jsxs)("p",{className:"queue-client"+("roomAssigned"===e.status?" assigned":""),children:["Client ",Object(m.jsx)("span",{className:"client-id",children:e.userId})]},e.userId)}))}),Object(m.jsxs)("div",{className:"buttons-container",children:[Object(m.jsx)("button",{type:"submit",name:"start-btn",id:"start-btn",disabled:null!=k||x.length<=0,onClick:P,children:"Start Chat"}),Object(m.jsx)("button",{type:"submit",name:"end-btn",id:"end-btn",disabled:null==k,onClick:F,children:"End Chat"})]})]})]})}),x=(a(47),function(){return Object(m.jsx)("div",{className:"dashboard"})}),v=(a(48),function(e){return Object(m.jsxs)("div",{className:"login",children:[Object(m.jsx)("h1",{className:"main-text",children:"HeartlineHK Login"}),Object(m.jsxs)("form",{className:"login-form",onSubmit:e.handleLogin,children:[Object(m.jsx)("label",{htmlFor:"login-email",children:"Email:"}),Object(m.jsx)("input",{type:"email",name:"login-email",id:"login-email",required:!0}),Object(m.jsx)("label",{htmlFor:"login-pwd",children:"Password:"}),Object(m.jsx)("input",{type:"password",name:"login-password",id:"login-password",required:!0}),Object(m.jsx)("input",{type:"submit",value:"Login",name:"login-submit",id:"login-submit"})]})]})});var g=function(){var e=Object(n.useState)(null),t=Object(u.a)(e,2),a=t[0],r=t[1],s=Object(n.useState)(!1),c=Object(u.a)(s,2),i=c[0],h=c[1],g=Object(n.useState)(f.a.auth()),O=Object(u.a)(g,2),k=O[0],w=(O[1],function(){var e=Object(o.a)(l.a.mark((function e(t){var a,n;return l.a.wrap((function(e){for(;;)switch(e.prev=e.next){case 0:if(t.preventDefault(),i){e.next=18;break}return h(!0),a=document.getElementById("login-email").value,n=document.getElementById("login-password").value,e.prev=5,e.next=8,k.signInWithEmailAndPassword(a,n);case 8:console.log(k.currentUser),e.next=15;break;case 11:e.prev=11,e.t0=e.catch(5),console.error(e.t0.message),alert(e.t0.message);case 15:h(!1),e.next=20;break;case 18:console.error("Already logging in"),alert("Already logging in!");case 20:case"end":return e.stop()}}),e,null,[[5,11]])})));return function(t){return e.apply(this,arguments)}}()),y=function(){var e=Object(o.a)(l.a.mark((function e(t){return l.a.wrap((function(e){for(;;)switch(e.prev=e.next){case 0:return e.prev=0,e.next=3,k.signOut();case 3:console.log("Signed out!"),e.next=10;break;case 6:e.prev=6,e.t0=e.catch(0),console.error(e.t0.message),alert(e.t0.message);case 10:case"end":return e.stop()}}),e,null,[[0,6]])})));return function(t){return e.apply(this,arguments)}}();return Object(n.useEffect)((function(){return f.a.auth().onAuthStateChanged((function(e){r(e||null)}))})),Object(m.jsx)(d.a,{children:Object(m.jsxs)("div",{className:"App",style:{width:"100vw",minHeight:"100vh",position:"relative",backgroundColor:"rgba(0,0,0,0.05)",display:"flex",flexDirection:"row",overflow:"hidden"},children:[!a&&Object(m.jsx)(v,{handleLogin:w}),a&&Object(m.jsxs)(m.Fragment,{children:[Object(m.jsx)(j,{currentUser:a,handleLogout:y}),Object(m.jsxs)(b.c,{children:[Object(m.jsx)(b.a,{exact:!0,path:"/chatroom",children:Object(m.jsx)(p,{currentUser:a})}),Object(m.jsx)(b.a,{path:"/",children:Object(m.jsx)(x,{currentUser:a})})]})]})]})})};f.a.initializeApp({apiKey:"AIzaSyD-gB_LHwUq2qiUXdDt2CAxGCYQQla4hMo",authDomain:"heartlinehk-8e3ec.firebaseapp.com",databaseURL:"https://heartlinehk-8e3ec-default-rtdb.asia-southeast1.firebasedatabase.app",projectId:"heartlinehk-8e3ec",storageBucket:"heartlinehk-8e3ec.appspot.com",messagingSenderId:"1077537941035",appId:"1:1077537941035:web:f5b566fde9a2363a2d6c6e",measurementId:"G-S9JD41562T"}),c.a.render(Object(m.jsx)(r.a.StrictMode,{children:Object(m.jsx)(g,{})}),document.getElementById("root"))}},[[49,1,2]]]);
//# sourceMappingURL=main.0624032c.chunk.js.map