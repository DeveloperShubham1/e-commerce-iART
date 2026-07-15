// src/utils/facebook.js

let fbSDKPromise = null;

export const loadFacebookSDK = (appId) => {
    if (fbSDKPromise) return fbSDKPromise;  

    console.log("[FB] appId from env:", appId);
    if (!appId) {
        return Promise.reject(new Error("VITE_FACEBOOK_APP_ID is missing — check your .env and restart the dev server"));
    }

    const existingScripts = document.querySelectorAll('script[src*="connect.facebook.net"]');
    console.log("[FB] existing FB script tags found:", existingScripts.length, existingScripts);

    fbSDKPromise = new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
            reject(new Error("Facebook SDK failed to load (timed out)"));
        }, 10000);

        window.fbAsyncInit = function () {
            console.log("[FB] fbAsyncInit fired, window.FB is:", window.FB);
            window.FB.init({
                appId,
                cookie: true,
                xfbml: false,
                version: "v25.0",
            });
            console.log("[FB] FB.init() called");

            window.FB.getLoginStatus((statusResponse) => {
                console.log("[FB] getLoginStatus callback fired:", statusResponse);
                clearTimeout(timeout);
                resolve(window.FB);
            });
        };

        if (!document.getElementById("facebook-jssdk")) {
            console.log("[FB] injecting sdk.js script tag");
            const script = document.createElement("script");
            script.id = "facebook-jssdk";
            script.src = "https://connect.facebook.net/en_US/sdk.js";
            script.async = true;
            script.defer = true;
            script.crossOrigin = "anonymous";
            script.onerror = () => {
                clearTimeout(timeout);
                reject(new Error("Facebook SDK failed to load"));
            };
            document.body.appendChild(script);
        } else {
            console.log("[FB] script tag with id facebook-jssdk already exists, not injecting again");
        }
    });

    return fbSDKPromise;
};