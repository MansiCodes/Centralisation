/**
 * Chrome only exposes crypto.randomUUID in secure contexts (HTTPS/localhost).
 * EC2 is served as http://IP — polyfill before any client chunk runs.
 */
export const CRYPTO_RANDOM_UUID_POLYFILL = `(function(){try{var c=globalThis.crypto;if(!c||typeof c.randomUUID==="function")return;if(typeof c.getRandomValues!=="function")return;c.randomUUID=function(){var b=new Uint8Array(16);c.getRandomValues(b);b[6]=(b[6]&0x0f)|0x40;b[8]=(b[8]&0x3f)|0x80;var h="";for(var i=0;i<16;i++){h+=(b[i]+256).toString(16).slice(1);}return h.slice(0,8)+"-"+h.slice(8,12)+"-"+h.slice(12,16)+"-"+h.slice(16,20)+"-"+h.slice(20);};}catch(e){}})();`;
