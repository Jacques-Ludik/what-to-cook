import { signIn, signOut, useSession } from "next-auth/react";
import Head from "next/head";
import Link from "next/link";
import { useEffect, useRef, useState, type SetStateAction } from "react";

import { api } from "~/utils/api";

export default function Home() {
  //const hello = api.post.hello.useQuery({ text: "from tRPC" });

  // Declare variables
  const [dietType, setDietType] = useState(false);
  const [dietTypeOption, setDietTypeOption] = useState("None");
  const dietTypeRef = useRef<HTMLDivElement>(null);
  const btnDietTypeRef = useRef<HTMLButtonElement>(null);
  const [estimatedTime, setEstimatedTime] = useState(false);
  const [estimatedTimeOption, setEstimatedTimeOption] = useState("30 minutes");
  const estimatedTimeRef = useRef<HTMLDivElement>(null);
  const btnEstimatedTimeRef = useRef<HTMLButtonElement>(null);
  const [allergens, setAllergens] = useState(false);
  const [allergensOption, setAllergensOption] = useState("None");
  const allergensRef = useRef<HTMLDivElement>(null);
  const btnAllergensRef = useRef<HTMLButtonElement>(null);





//------------------ DIET TYPE --------------------
const handleToggleDietType = () => {
    setDietType(!dietType);
  };
  const handleDietTypeOption = (option: SetStateAction<string>) => {
    setDietTypeOption(option);
    setDietType(false);
  };
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dietTypeRef.current &&
        !dietTypeRef.current.contains(event.target as Node) &&
        btnDietTypeRef.current &&
        !btnDietTypeRef.current.contains(event.target as Node)
      ) {
        setDietType(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);
  const dietTypeOptions = ['None', 'Pescatarian', 'Pollotarian', 'Vegetarian', 'Vegan'];

  //------------------ ESTIMATED TIME --------------------
const handleToggleEstimatedTime = () => {
    setEstimatedTime(!estimatedTime);
  };
  const handleEstimatedTimeOption = (option: SetStateAction<string>) => {
    setEstimatedTimeOption(option);
    setEstimatedTime(false);
  };
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        estimatedTimeRef.current &&
        !estimatedTimeRef.current.contains(event.target as Node) &&
        btnEstimatedTimeRef.current &&
        !btnEstimatedTimeRef.current.contains(event.target as Node)
      ) {
        setEstimatedTime(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);
  const estimatedTimeOptions = ['15 minutes', '30 minutes', '45 minutes', '60 minutes', '75 minutes', '90 minutes',  '120 minutes'];

  //------------------ Allergens --------------------
const handleToggleAllergens = () => {
    setAllergens(!allergens);
  };
  const handleAllergensOption = (option: SetStateAction<string>) => {
    setAllergensOption(option);
    setAllergens(false);
  };
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        allergensRef.current &&
        !allergensRef.current.contains(event.target as Node) &&
        btnAllergensRef.current &&
        !btnAllergensRef.current.contains(event.target as Node)
      ) {
        setAllergens(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);
  const allergensOptions = ["Milk", "Eggs", "Fish", "Crustacean shellfish", "Tree nuts", "Peanuts", "Wheat", "Soybeans", "Sesame", "Mustard", "Celery", "Molluscs", "Lupin", "Sulfer dioxide"];








  return (
    <>
      <Head>
        <title>What to Cook</title>
        <meta name="description" content="Select ingredients you have available get delicious recipe ideas" />
        <link rel="icon" href="/whattocook-logo2.png" />
      </Head>
      <main className="flex min-h-screen flex-col items-center bg-gradient-to-b from-emerald-300 to-emerald-900">
          <h1 className="text-xl font-extrabold tracking-tight text-white sm:text-[3rem]">
            What to <span className="text-amber-600">Cook</span>
          </h1>
          <input
            type="text"
            placeholder="Search for ingredients/recipes..."
            className="mt-2 w-full max-w-md rounded-lg border border-gray-900 bg-white p-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-600"/>  
          <div className="mt-4 flex flex-col items-center gap-2">
            <p className="text-lg text-black font-bold">
              Ingredients
                  </p>
                  <div className="flex flex-wrap items-center justify-center gap-2">
              <div className="flex gap-1"><input type="checkbox"/><span className=" px-3 py-1 text-white">Chicken</span></div>
              <div className="flex gap-1"><input type="checkbox"/><span className=" px-3 py-1 text-white">Rice</span></div>
              <div className="flex gap-1"><input type="checkbox"/><span className=" py-1 text-white">Broccoli</span></div>
              <div className="flex gap-1"><input type="checkbox"/><span className=" px-3 py-1 text-white">Garlic</span></div>
              <div className="flex gap-1"><input type="checkbox"/><span className=" px-3 py-1 text-white">Olive Oil</span></div>
              <div className="flex gap-1"><input type="checkbox"/><span className=" px-3 py-1 text-white">Salt</span></div>
            </div>  
            <div className="flex flex-wrap items-center justify-center gap-2">
              <div className="flex gap-1"><input type="checkbox"/><span className=" px-3 py-1 text-white">Chicken</span></div>
              <div className="flex gap-1"><input type="checkbox"/><span className=" px-3 py-1 text-white">Rice</span></div>
              <div className="flex gap-1"><input type="checkbox"/><span className=" py-1 text-white">Broccoli</span></div>
              <div className="flex gap-1"><input type="checkbox"/><span className=" px-3 py-1 text-white">Garlic</span></div>
              <div className="flex gap-1"><input type="checkbox"/><span className=" px-3 py-1 text-white">Olive Oil</span></div>
              <div className="flex gap-1"><input type="checkbox"/><span className=" px-3 py-1 text-white">Salt</span></div>
            </div> 
            <div className="flex flex-wrap items-center justify-center gap-2">
              <div className="flex gap-1"><input type="checkbox"/><span className=" px-3 py-1 text-white">Chicken</span></div>
              <div className="flex gap-1"><input type="checkbox"/><span className=" px-3 py-1 text-white">Rice</span></div>
              <div className="flex gap-1"><input type="checkbox"/><span className=" py-1 text-white">Broccoli</span></div>
              <div className="flex gap-1"><input type="checkbox"/><span className=" px-3 py-1 text-white">Garlic</span></div>
              <div className="flex gap-1"><input type="checkbox"/><span className=" px-3 py-1 text-white">Olive Oil</span></div>
              <div className="flex gap-1"><input type="checkbox"/><span className=" px-3 py-1 text-white">Salt</span></div>
            </div> 

            <p className="text-lg text-black font-bold">
              Preferences
                  </p>
                  <div className="flex flex-wrap items-start justify-center gap-5">

                <div className="flex items-start">
                    <div className="mr-3 flex items-center py-2">
                      <label  htmlFor="dietType" className="text-white font-bold">
                        Diet Type
                      </label>
                    </div>
                    <div className="flex flex-col">
                      <button
                        ref={btnDietTypeRef}
                        className=" inline-flex items-center rounded-lg bg-amber-600 px-5 py-2.5 text-center text-sm font-medium text-white hover:bg-orange-500 focus:outline-none focus:ring-4 focus:ring-blue-300"
                        type="button"
                        onClick={handleToggleDietType}
                      >
                        {dietTypeOption + " "}
                        <svg className="ms-3 h-2.5 w-2.5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 10 6">
                          <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 4 4 4-4" />
                        </svg>
                      </button>
                      {dietType && (
                        <div ref={dietTypeRef} className="z-10 w-44 divide-y divide-gray-100 rounded-lg bg-white shadow">
                          <ul className="py-2 text-sm text-gray-700" aria-labelledby="dropdownHoverButton">
                            {dietTypeOptions.map((option) => (
                              <li key={option} onClick={() => handleDietTypeOption(option)}>
                                <button className="block px-4 py-2 hover:bg-gray-100">{option}</button>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>

              <div className="flex items-start">
                    <div className="mr-3 flex items-center py-2">
                      <label  htmlFor="estimatedTime" className="text-white font-bold">
                        Estimated Time
                      </label>
                    </div>
                    <div className="flex flex-col">
                      <button
                        ref={btnEstimatedTimeRef}
                        className=" inline-flex items-center rounded-lg bg-amber-600 px-5 py-2.5 text-center text-sm font-medium text-white hover:bg-orange-500 focus:outline-none focus:ring-4 focus:ring-blue-300"
                        type="button"
                        onClick={handleToggleEstimatedTime}
                      >
                        {estimatedTimeOption + " "}
                        <svg className="ms-3 h-2.5 w-2.5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 10 6">
                          <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 4 4 4-4" />
                        </svg>
                      </button>
                      {estimatedTime && (
                        <div ref={estimatedTimeRef} className="z-10 w-44 divide-y divide-gray-100 rounded-lg bg-white shadow">
                          <ul className="py-2 text-sm text-gray-700" aria-labelledby="dropdownHoverButton">
                            {estimatedTimeOptions.map((option) => (
                              <li key={option} onClick={() => handleEstimatedTimeOption(option)}>
                                <button className="block px-4 py-2 hover:bg-gray-100">{option}</button>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>

                      <div className="flex items-start">
                    <div className="mr-3 flex items-center py-2">
                      <label  htmlFor="allergens" className="text-white font-bold">
                        Allergens
                      </label>
                    </div>
                    <div className="flex flex-col">
                      <button
                        ref={btnAllergensRef}
                        className=" inline-flex items-center rounded-lg bg-amber-600 px-5 py-2.5 text-center text-sm font-medium text-white hover:bg-orange-500 focus:outline-none focus:ring-4 focus:ring-blue-300"
                        type="button"
                        onClick={handleToggleAllergens}
                      >
                        {allergensOption + " "}
                        <svg className="ms-3 h-2.5 w-2.5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 10 6">   
                          <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 4 4 4-4" />
                        </svg>
                      </button>
                      {allergens && (
                        <div ref={allergensRef} className="z-10 w-44 divide-y divide-gray-100 rounded-lg bg-white shadow">
                          <ul className="py-2 text-sm text-gray-700" aria-labelledby="dropdownHoverButton">
                            {allergensOptions.map((option) => (
                              <li key={option} onClick={() => handleAllergensOption(option)}>
                                <button className="block px-4 py-2 hover:bg-gray-100">{option}</button>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>

              {/* <div className="flex gap-1"><input id="allergens" type="checkbox" className=" accent-amber-600"/><label htmlFor="allergens" className=" py-1 text-white">Allergens</label></div> */}
              <div className="flex gap-1"><input id="highProtein" type="checkbox" className=" accent-amber-600"/><label htmlFor="highProtein" className="  py-1 text-white">High Protein</label></div>
              <div className="flex gap-1"><input id="lowCalorie" type="checkbox" className=" accent-amber-600"/><label htmlFor="lowCalorie" className=" py-1 text-white">Low Calorie</label></div>
            </div>  

            <button
              className="mt-4 rounded-xl bg-amber-600 px-10 py-3 font-bold text-white text-xl no-underline transition hover:bg-orange-500"
              onClick={() => {
                // Handle search logic here
                console.log("Searching with options:", {
                  dietType: dietTypeOption,
                  estimatedTime: estimatedTimeOption,
                  allergens: allergensOption,
                });}}> Let&apos;s Cook!</button>                   

</div>


      </main>
    </>
  );
}



// <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#2e026d] to-[#15162c]">
//         <div className="container flex flex-col items-center justify-center gap-12 px-4 py-16">
//           <h1 className="text-5xl font-extrabold tracking-tight text-white sm:text-[5rem]">
//             Create <span className="text-[hsl(280,100%,70%)]">T3</span> App
//           </h1>
//           <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-8">
//             <Link
//               className="flex max-w-xs flex-col gap-4 rounded-xl bg-white/10 p-4 text-white hover:bg-white/20"
//               href="https://create.t3.gg/en/usage/first-steps"
//               target="_blank"
//             >
//               <h3 className="text-2xl font-bold">First Steps →</h3>
//               <div className="text-lg">
//                 Just the basics - Everything you need to know to set up your
//                 database and authentication.
//               </div>
//             </Link>
//             <Link
//               className="flex max-w-xs flex-col gap-4 rounded-xl bg-white/10 p-4 text-white hover:bg-white/20"
//               href="https://create.t3.gg/en/introduction"
//               target="_blank"
//             >
//               <h3 className="text-2xl font-bold">Documentation →</h3>
//               <div className="text-lg">
//                 Learn more about Create T3 App, the libraries it uses, and how
//                 to deploy it.
//               </div>
//             </Link>
//           </div>
//           <div className="flex flex-col items-center gap-2">
//             <p className="text-2xl text-white">
//               {/* {hello.data ? hello.data.greeting : "Loading tRPC query..."} */}
//             </p>
//             <AuthShowcase />
//           </div>
//         </div>
//       </main>

// function AuthShowcase() {
//   const { data: sessionData } = useSession();

//   const { data: secretMessage } = api.post.getSecretMessage.useQuery(
//     undefined, // no input
//     { enabled: sessionData?.user !== undefined },
//   );

//   return (
//     <div className="flex flex-col items-center justify-center gap-4">
//       <p className="text-center text-2xl text-white">
//         {sessionData && <span>Logged in as {sessionData.user?.name}</span>}
//         {secretMessage && <span> - {secretMessage}</span>}
//       </p>
//       <button
//         className="rounded-full bg-white/10 px-10 py-3 font-semibold text-white no-underline transition hover:bg-white/20"
//         onClick={sessionData ? () => void signOut() : () => void signIn()}
//       >
//         {sessionData ? "Sign out" : "Sign in"}
//       </button>
//     </div>
//   );
// }
