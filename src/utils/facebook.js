// src/utils/facebook.js

let fbSDKPromise = null;

export const loadFacebookSDK = (appId) => {
    if (fbSDKPromise) return fbSDKPromise;


    if (!appId) {
        return Promise.reject(new Error("VITE_FACEBOOK_APP_ID is missing — check your .env and restart the dev server"));
    }

    const existingScripts = document.querySelectorAll('script[src*="connect.facebook.net"]');


    fbSDKPromise = new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
            reject(new Error("Facebook SDK failed to load (timed out)"));
        }, 10000);

        window.fbAsyncInit = function () {

            window.FB.init({
                appId,
                cookie: true,
                xfbml: false,
                version: "v25.0",
            });


            window.FB.getLoginStatus((statusResponse) => {

                clearTimeout(timeout);
                resolve(window.FB);
            });
        };

        if (!document.getElementById("facebook-jssdk")) {

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