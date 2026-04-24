// /**
//  * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
//  * for Docker builds.
//  */
// import "./src/env.js";

// /** @type {import("next").NextConfig} */
// const config = {
//   reactStrictMode: true,
//   images: {
//     remotePatterns: [
//       {
//         protocol: "https",
//         hostname: "lh3.googleusercontent.com",
//         port: "",
//         pathname: "/a/**", 
//       },
//       {
//         protocol: "https",
//         hostname: "www.themealdb.com",
//         port: "",
//         pathname: "/**",
//       },
//       {
//         protocol: "https",
//         hostname: "storage.googleapis.com",
//         port: "",
//         pathname: "/whattocook-b3edb.firebasestorage.app/**",
//       }
//     ],
//   },

//   /**
//    * If you are using `appDir` then you must comment the below `i18n` config out.
//    *
//    * @see https://github.com/vercel/next.js/issues/41980
//    */
//   i18n: {
//     locales: ["en"],
//     defaultLocale: "en",
//   },
// };

// export default config;























/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
import "./src/env.js";

/** @type {import("next").NextConfig} */
const config = {
  reactStrictMode: true,
  // Add or modify the 'images' property here
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        port: "",
        pathname: "/a/**", // This makes it more specific to user avatars
      },
      // You can add other trusted hostnames here in the future
      new URL ('https://www.themealdb.com/**'),
      //new URL ('https://m.ftscrt.com/static/recipe/**'),
      new URL ('https://storage.googleapis.com/whattocook-a1eeb.firebasestorage.app/**')
    ],
  },

  /**
   * If you are using `appDir` then you must comment the below `i18n` config out.
   *
   * @see https://github.com/vercel/next.js/issues/41980
   */
  i18n: {
    locales: ["en"],
    defaultLocale: "en",
  },
};

export default config;
