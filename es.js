const e=new FinalizationRegistry((([e,t,n])=>{n&&console.debug(`%c${String(t)}`,"font-weight:bold","collected"),e(t)})),t=Object.create(null),n=(n,r,{debug:o,handler:c,return:i,token:l=n}=t)=>{const g=i||new Proxy(n,c||t),s=[g,[r,n,!!o]];return!1!==l&&s.push(l),e.register(...s),g},r=t=>e.unregister(t);export{n as create,r as drop};
