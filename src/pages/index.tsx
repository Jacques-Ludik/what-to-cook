import { signIn, signOut, useSession } from "next-auth/react";
import Head from "next/head";
import Link from "next/link";
import Image from "next/image";
import { use, useEffect, useRef, useState, type SetStateAction } from "react";
import { recipesToSeed } from "recipes-data"; // Import the data
import { api } from "~/utils/api";

// Types
 type AllergensOptions = {
    id: number;
    allergen: string;
    state: boolean;
  };

  type Allergens = {
    id: number;
    allergen: string;
  };

  type AllergensSelect = {
    allSelected: boolean;
    clear: boolean;
  };

  type DietType = {
    id: number;
    type: string;
  };

export default function Home() {

  //routes
  const getTopIngredients = api.recipe.getTopIngredients.useQuery();

  // Declare variables
  const [dietType, setDietType] = useState(false);
  const [dietTypeOption, setDietTypeOption] = useState<DietType>({ id: 1, type: "None" });
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
const dietTypeOptions = [{ id: 1, type: 'None' }, {id:2, type: 'Pescatarian'}, {id:3, type:'Pollotarian'}, {id:4, type:'Vegetarian'}, {id:5, type:'Vegan'}, {id:6, type:'Halal'}, {id:7, type:'Keto'}];
const handleToggleDietType = () => {
    setDietType(!dietType);
  };
  const handleDietTypeOption = (option: SetStateAction<string>, id: number) => {
    const dietType_ =  dietTypeOptions.find((diet) => diet.id === id);
    if (!dietType_) return;
    setDietTypeOption(dietType_);
    setDietType(false);
  }
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
  

  //------------------ ESTIMATED TIME --------------------
const estimatedTimeOptions = ['15 minutes', '30 minutes', '45 minutes', '60 minutes', '75 minutes', '90 minutes',  '120 minutes'];
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

  //------------------ ALLERGENS --------------------
const handleToggleAllergens = () => {
    setAllergens(!allergens);
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
  const [allergensListOptions, setAllergensListOptions] = useState<AllergensOptions[]>([]);
  const [allergensSelection, setAllergensSelection] = useState<AllergensSelect>();
  const [allergensList, setAllergensList] = useState<Allergens[]>([]);

  const handleAllergens = (id: number, option: SetStateAction<string>, state: boolean, selectionAllergens: string) => {
    if (selectionAllergens === "allSelected") {
      setAllergensOption("Select All");
      setAllergensSelection({ allSelected: state, clear: false });
      const allergens_ = allergensListOptions.map((allergen) => ({
        id: allergen.id,
        allergen: allergen.allergen,
      }));
      setAllergensList(allergens_.sort((a, b) => a.id - b.id));
      setAllergensListOptions(allergensListOptions.map((allergen) => ({ ...allergen, state: true })));
    } else if (selectionAllergens === "clear") {
      setAllergensOption("Clear All");
      setAllergensSelection({ allSelected: false, clear: state });
      setAllergensList([]);
      setAllergensListOptions(allergensListOptions.map((allergen) => ({ ...allergen, state: false })));
    } else if (selectionAllergens === "normal") {
      setAllergensOption(option);
      setAllergensSelection({ allSelected: false, clear: false });
      if (state) {
        const allergen_: Allergens = {
          id: id,
          allergen: String(option),
        };
        const allergensIDList = allergensList.map((allergen) => allergen.id);
        if (!allergensIDList.includes(id)) {
          setAllergensList([...allergensList, allergen_]);
        }
        setAllergensListOptions(allergensListOptions.map((allergen) => (allergen.id === id ? { ...allergen, state: true } : allergen)));
      } else {
        const updatedAllergensList = allergensList.filter((allergen) => allergen.id !== id);
        setAllergensList(updatedAllergensList.sort((a, b) => a.id - b.id));
        setAllergensListOptions(allergensListOptions.map((allergen) => (allergen.id === id ? { ...allergen, state: false } : allergen)));
      }
    }
  }
  useEffect(() => {
    //set allergens options
    const allergensOptions = [{ id: 1, name: 'Wheat'}, {id:2, name:'Milk'}, { id: 3, name: 'Eggs'}, { id: 4, name: 'Sulfur Dioxide'}, { id: 5, name: 'Celery'}, { id: 6, name: 'Soybeans'}, { id: 7, name: 'Fish'}, { id: 8, name: 'Tree Nuts'}, { id: 9, name: 'Mustard'}, { id: 10, name: 'Sesame'}, { id: 11, name: 'Crustacean Shellfish'}, { id: 12, name: 'Peanuts'}, { id: 13, name: 'Molluscs'}, { id: 14, name: "Lupin"}];
    // const allergensOptions = [ { id: 1, name: "Milk"} , { id: 2, name: "Eggs"}, { id: 3, name: "Fish"}, { id: 4, name: "Crustacean Shellfish"}, { id: 5, name: "Tree Nuts"}, { id: 6, name: "Peanuts"}, { id: 7, name: "Wheat"}, { id: 8, name: "Soybeans"}, { id: 9, name: "Sesame"}, { id: 10, name: "Mustard"}, { id: 11, name: "Celery"}, { id: 12, name: "Molluscs"}, { id: 13, name: "Lupin"}, { id: 14, name: "Sulfur dioxide"}];
    const initialAllergensListOptions = allergensOptions.map((allergen, index) => ({
      id: index + 1,
      allergen: allergen.name,
      state: false,
    }));
    setAllergensListOptions(initialAllergensListOptions);

    //set top ingredients
    console.log("Top ingredients: ", getTopIngredients.data);
  }, []);

  return (
    <>
      <Head>
        <title>What to Cook</title>
        <meta name="description" content="Select ingredients you have available to get mouth watering recipes or just browse through delicious recipe ideas" />
        <link rel="icon" href="/whattocook-logo2.png" />
      </Head>
      <main className="flex min-h-screen flex-col items-center bg-[#faebd7]">
        {/* from-emerald-500 to-emerald-900   text-white     text-amber-600     #FAF9F6   #faebd7*/}
          <div className="flex gap-2"><h1 className="text-xl font-extrabold tracking-tight text-black sm:text-[3rem]">
            What to <span className="text-green-800">Cook</span>
          </h1>
        </div>
          <input
            type="text"
            placeholder="Search for ingredients/recipes..."
            className="mt-2 w-full max-w-md rounded-lg border border-gray-900 bg-white p-1 text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-800"/>  
          <div className="mt-4 flex flex-col items-center gap-2">
            <div className="flex flex-col items-center gap-[0.3rem] border-2 border-green-900 p-4 rounded-2xl w-full max-w-[47%]">
            <p className="text-lg text-black font-bold">
              Ingredients
                  </p>
                  <div className="flex flex-wrap items-center justify-center gap-4">
                    {getTopIngredients.data && getTopIngredients.data.map((ingredient, index) => (
                      <div className="flex gap-1" key={index}><input type="checkbox" id={"Ingredient"+String(index)} className=" accent-green-800"/><label htmlFor={"Ingredient"+String(index)} className=" text-black">{ingredient.name}</label></div>
                    ))}
            </div> 
</div>

<div className="flex flex-col items-center gap-[0.3rem] border-2 border-green-900 p-4 rounded-2xl w-full max-w-[47%]">
            <p className="text-lg text-black font-bold">
              Preferences
                  </p>
                  <div className="flex flex-wrap items-start justify-center gap-5">
                <div className="flex items-start">
                    <div className="mr-3 flex items-center py-2">
                      <label  htmlFor="dietType" className="text-black font-bold">
                        Diet Type
                      </label>
                    </div>
                    <div className="flex flex-col relative">
                      <button
                        ref={btnDietTypeRef}
                        className=" inline-flex items-center rounded-lg bg-green-800 px-5 py-2.5 text-center text-sm font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-4 focus:ring-blue-300"
                        type="button"
                        onClick={handleToggleDietType}
                      >
                        {dietTypeOption.type + " "}
                        <svg className="ms-3 h-2.5 w-2.5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 10 6">
                          <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 4 4 4-4" />
                        </svg>
                      </button>
                      {dietType && (
                        <div ref={dietTypeRef} className="absolute top-11 z-10 w-32 divide-y divide-gray-100 rounded-lg bg-white shadow">
                          <ul className="py-2 text-sm text-gray-700" aria-labelledby="dropdownHoverButton">
                            {dietTypeOptions.map((option) => (
                              <li key={option.id} onClick={() => handleDietTypeOption(option.type, option.id)}>
                                <button className="block px-4 py-2 hover:bg-gray-100">{option.type}</button>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>

              <div className="flex items-start">
                    <div className="mr-3 flex items-center py-2">
                      <label  htmlFor="estimatedTime" className="text-black font-bold">
                        Estimated Time
                      </label>
                    </div>
                    <div className="flex flex-col relative">
                      <button
                        ref={btnEstimatedTimeRef}
                        className=" inline-flex items-center rounded-lg bg-green-800 px-5 py-2.5 text-center text-sm font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-4 focus:ring-blue-300"
                        type="button"
                        onClick={handleToggleEstimatedTime}
                      >
                        {estimatedTimeOption + " "}
                        <svg className="ms-3 h-2.5 w-2.5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 10 6">
                          <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 4 4 4-4" />
                        </svg>
                      </button>
                      {estimatedTime && (
                        <div ref={estimatedTimeRef} className="absolute top-11 z-10 w-36 divide-y divide-gray-100 rounded-lg bg-white shadow">
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
                      <label  htmlFor="allergens" className="text-black font-bold">
                        Allergens
                      </label>
                    </div>
                    <div className="flex flex-col relative">
                      <button
                        ref={btnAllergensRef}
                        className=" inline-flex items-center rounded-lg bg-green-800 px-5 py-2.5 text-center text-sm font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-4 focus:ring-blue-300"
                        type="button"
                        onClick={handleToggleAllergens}
                      >
                        {allergensOption + " "}
                        <svg className="ms-3 h-2.5 w-2.5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 10 6">   
                          <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 4 4 4-4" />
                        </svg>
                      </button>
                      {allergens && (
                        <div ref={allergensRef} className="absolute top-11 z-10 w-44 divide-y divide-gray-100 rounded-lg bg-white shadow">

                        <ul className="py-2 text-sm text-gray-700" aria-labelledby="dropdownHoverButton">
                            <li key={1}>
                              <div className="flex items-center px-2">
                                <input
                                  id="1"
                                  type="checkbox"
                                  checked={allergensSelection?.allSelected}
                                  onChange={(e) => handleAllergens(0, "", e.target.checked, "allSelected")}
                                  className="h-4 w-4 rounded bg-gray-100 text-main-orange accent-green-800 focus:ring-2"
                                />
                                <label htmlFor="1" className="ms-2 text-sm font-bold text-gray-900">
                                  Select All
                                </label>
                              </div>
                            </li>
                            <li key={2}>
                              <div className="flex items-center px-2">
                                <input
                                  id="2"
                                  type="checkbox"
                                  checked={allergensSelection?.clear}
                                  onChange={(e) => handleAllergens(0, "", e.target.checked, "clear")}
                                  className="h-4 w-4 rounded bg-gray-100 text-main-orange accent-green-800 focus:ring-2"
                                />
                                <label htmlFor="2" className="ms-2 text-sm font-bold text-gray-900">
                                  Clear All
                                </label>
                              </div>
                            </li>
                            {allergensListOptions?.map((option) => (
                              <li key={option.allergen}>
                                <div className="flex items-center px-2">
                                  <input
                                    id={String(option.allergen)}
                                    type="checkbox"
                                    checked={option.state}
                                    onChange={(e) => handleAllergens(option.id, option.allergen, e.target.checked, "normal")}
                                    className="h-4 w-4 rounded bg-gray-100 text-main-orange accent-green-800 focus:ring-2"
                                  />
                                  <label htmlFor={String(option.allergen)} className="ms-2 text-sm font-medium text-gray-900">
                                    {option.allergen}
                                  </label>
                                </div>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
              <div className="flex gap-1"><input id="highProtein" type="checkbox" className=" accent-green-800"/><label htmlFor="highProtein" className="  py-1 text-black">High Protein</label></div>
              <div className="flex gap-1"><input id="lowCalorie" type="checkbox" className=" accent-green-800"/><label htmlFor="lowCalorie" className=" py-1 text-black">Low Calorie</label></div>
            </div>  
           
            </div>

            <button
              className="mt-4 rounded-xl bg-green-800 px-10 py-3 font-bold text-white text-xl no-underline transition hover:bg-green-700"
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



















//Creation code
  //const hello = api.post.hello.useQuery({ text: "from tRPC" });
  //routes
  // const createIngredients = api.recipe.createIngredients.useMutation();
  // const createDietTypes = api.recipe.createDietTypes.useMutation();
  // const createAllergens = api.recipe.createAllergens.useMutation();
  // //const createRecipes = api.recipe.createRecipes.useMutation();
  // const getAllIngredients = api.recipe.getAllIngredients.useQuery();
  // const getAllAllergens = api.recipe.getAllAllergens.useQuery();
  // const getAllDietTypes = api.recipe.getAllDietTypes.useQuery();
  
//   //------------------ Create Ingredients --------------------
//   const ingredients = ['Butter', 'Garlic', 'Olive Oil', 'Onions', 'Salt', 'Eggs', 'Water', 'Sugar', 'Milk', 'Potatoes', 'Flour', 'Pepper', 'Carrots', 'Caster Sugar', 'Parsley', 'Vegetable Oil', 'Soy Sauce', 'Garlic Clove', 'Bay Leaves', 'Coriander', 'Lemon', 'Ginger', 'Tomato Puree', 'Paprika', 'Spring Onions', 'Thyme', 'Chicken Stock', 'Cinnamon', 'Cumin', 'Double Cream', 'Tomatoes', 'Beef', 'Baking Powder', 'Mushrooms', 'Red Pepper', 'Lime', 'Oil', 'Bread', 'Celery', 'Bacon', 'Lemon Juice', 'Icing Sugar', 'Black Pepper', 'Vanilla Extract', 'Egg Yolks', 'Vegetable Stock', 'Beef Stock', 'Allspice', 'Chicken', 'Red Chilli', 'Parmesan', 'Nutmeg', 'Self-raising Flour', 'Red Onions', 'Pork', 'Rice', 'White Wine', 'Sour Cream', 'Breadcrumbs', 'Cabbage', 'Brown Sugar', 'Rosemary', 'Sunflower Oil', 'Leek', 'Mint', 'Sesame Seed Oil', 'Worcestershire Sauce', 'Coconut Milk', 'Corn Flour', 'Cardamom', 'Minced Beef', 'Basil', 'Honey', 'Orange', 'Chicken Breasts', 'Muscovado Sugar', 'Greek Yogurt', 'Puff Pastry', 'Red Wine', 'Cornstarch', 'Cucumber', 'White Wine Vinegar', 'Dill', 'Prawns', 'Spinach', 'Shallots', 'Cayenne Pepper', 'Fennel', 'Green Chilli', 'Mustard', 'Cloves', 'Sausages', 'Yeast', 'Hotsauce', 'Garlic Powder', 'Garam Masala', 'Harissa Spice', 'Sea Salt', 'Cream Cheese', 'Red Wine Vinegar', 'Dry White Wine', 'Courgettes/Zucchinis', 'Vinegar', 'Peanuts', 'Lamb', 'Saffron', 'Peanut Butter', 'Turmeric', 'Cinnamon Stick', 'Creme Fraiche', 'Black Treacle', 'Almonds', 'Cherry Tomatoes', 'Salmon', 'Black Olives', 'Mayonnaise', 'Green Pepper', 'Cannellini Beans', 'Cumin Seeds', 'Heavy Cream', 'Chickpeas', 'Vanilla', 'Basmati Rice', 'Egg Plants/Aubergine', 'Peas', 'Digestive Biscuits', 'Unsalted Butter', 'Chicken Thighs', 'Tamarind Paste', 'English Mustard', 'Beef Brisket', 'Broccoli', 'Rapeseed Oil', 'Raspberries', 'Starch', 'Oyster Sauce', 'Egg White', 'Chilli Powder', 'Avocado', 'Brandy', 'Basil Leaves', 'Dark Chocolate', 'Shortcrust Pastry', 'Kale', 'Mozzarella', 'Strawberries', 'Yellow Pepper', 'Chives', 'Dried Oregano', 'Salted Butter', 'Ground Almonds', 'Blackberries', 'Beef Fillet', 'Oregano', 'Tomato Ketchup', 'Suet', 'Green Beans', 'Minced Garlic', 'Bicarbonate Of Soda', 'Golden Syrup', 'Red Pepper Flakes/Red Chilli Flakes', 'Macaroni', 'Lettuce', 'Ham', 'Custard', 'Feta', 'Gruyère', 'Fish Stock', 'Kidney Beans', 'Curry Powder', 'Sage', 'Chilli', 'Brown Lentils', 'Lamb Mince', 'Almond Extract', 'Flaked Almonds', 'Braeburn Apples', 'Demerara Sugar', 'Chorizo', 'Plum Tomatoes', 'Banana', 'Pecan Nuts', 'Swede', 'Celeriac', 'Noodles', 'Ricotta', 'Maple Syrup', 'Ground Beef', 'Cheese', 'Onion Salt', 'Marjoram', 'Star Anise', 'Coconut Cream', 'White Vinegar', 'Cheddar Cheese', 'Smoked Paprika', 'Sake', 'Chicken Legs', 'King Prawns', 'Passata', 'Whole Milk', 'Light Brown Soft Sugar', 'Cocoa', 'Walnuts', 'Dried Fruit', 'Single Cream', 'Raisins', 'Lentils', 'Mascarpone', 'Currants', 'Small Potatoes', 'Celery Salt', 'Cilantro', 'Pita Bread', 'Rice Vinegar', 'Mussels', 'Broad Beans', 'Tofu', 'Sushi Rice', 'Mirin', 'Smoked Haddock', 'Fish Sauce', 'Lasagne Sheets', 'Tuna', 'Anchovy Fillet', 'Spaghetti', 'Rocket', 'Baguette', 'Bramley Apples', 'Ice Cream', 'Raspberry Jam', 'Red Chilli Powder', 'Coriander Leaves/Cilantro', 'Balsamic Vinegar', 'Tomato Sauce', 'Butter Beans', 'Yogurt', 'Apricot', 'Goose Fat', 'Chestnut Mushroom', 'Bean Sprouts', 'Barbeque Sauce', 'Sesame Seed Burger Buns', 'Sauerkraut', 'Filo Pastry', 'Beetroot', 'Buckwheat', 'Corn Tortillas', 'Granulated Sugar', 'Christmas Pudding', 'Ginger Paste', 'Cream', 'Squash', 'White Fish', 'Shredded Mexican Cheese', 'Jalapeno', 'Linguine Pasta', 'Clams', 'Mustard Powder', 'Sweetcorn', 'Couscous', 'Cacao', 'Dark Brown Soft Sugar', 'Milk Chocolate', 'Ginger Cordial', 'Cashew Nuts', 'Candied Peel', 'Grand Marnier', 'Glace Cherry', 'Italian Fennel Sausages', 'Shiitake Mushrooms', 'Quinoa', 'Pickle Juice', 'Pork Chops', 'Minced Pork', 'Lamb Shoulder', 'Garlic Sauce', 'Sesame Seed', 'Ghee', 'Apricot Jam', 'Duck Legs', 'Mixed Peel', 'Black Pudding', 'Scotch Bonnet', 'Ground Pork', 'Floury Potatoes', 'Jerusalem Artichokes', 'Fettuccine', 'Lard', 'Haddock', 'Sardines', 'Cod', 'Kosher Salt', 'Chocolate Chips', 'Condensed Milk', 'White Chocolate Chips', 'Miniature Marshmallows', 'Water Chestnut', 'Pumpkin', 'Canola Oil', 'Fennel Bulb', 'Lamb Leg', 'Butternut Squash', 'Mozzarella Balls', 'Lamb Kidney', 'Scallions', 'Chinese Broccoli', 'Lemon Zest', 'Rice Stick Noodles', 'Fennel Seeds', 'Blueberries', 'Ground Ginger', 'Tiger Prawns', 'Pecorino', 'Apple Cider Vinegar', 'Pine Nuts', 'Frozen Peas', 'Ground Cumin', 'Pretzels', 'Cooking Wine', 'Rice Wine', 'Sultanas', 'Parma Ham', 'Ancho Chillies', 'Dark Brown Sugar', 'Borlotti Beans', 'Stilton Cheese', 'Stout', 'Oysters', 'Hazelnuts', 'Pink Food Colouring', 'Marzipan', 'Beef Shin', 'Bouquet Garni', 'Brie', 'Prosciutto', 'Dark Rum', 'Iceberg Lettuce', 'Dill Pickles', 'Kielbasa', 'Caraway Seed', 'Beef Stock Concentrate', 'Enchilada Sauce', 'Shredded Monterey Jack Cheese', 'Rolled Oats', 'Coriander Seeds', 'Turmeric Powder', 'Fenugreek', 'Farfalle/Bowtie Pasta', 'Fajita Seasoning', 'Cajun', 'Flour Tortilla', 'Little Gem Lettuce', 'Salsa', 'Vinaigrette Dressing', 'Refried Beans', 'Hard Taco Shells', 'Grape Tomatoes', 'Green Salsa', 'Potato Starch', 'Sugar Snap Peas', 'Fromage Frais', 'Dried Apricots', 'Dark Chocolate Chips', 'Tinned Tomatoes', 'White Flour', 'Red Wine Jelly', 'Sun-dried Tomatoes', 'Mars Bar', 'Rice Krispies', 'Orange Blossom Water', 'Sherry', 'Mixed Spice', 'Rose Water', 'Cider', 'Toor Dal', 'Mustard Seeds', 'Meringue Nests', 'Red Snapper', 'Malt Vinegar', 'Semi-skimmed Milk', 'White Fish Fillets', 'French Lentils', 'Clotted Cream', 'Baked Beans', 'Tarragon Leaves', 'Raw King Prawns', 'Cubed Feta Cheese', 'Monterey Jack Cheese', 'Colby Jack Cheese', 'Duck Sauce', 'Gochujang', 'Wood Ear Mushrooms', 'Fruit Mix', 'Whole Wheat', 'Lamb Loin Chops', 'Turnips', 'Charlotte Potatoes', 'Fries', 'Doner Meat', 'Gouda Cheese', 'Ras El Hanout', 'Shortening', 'Vine Leaves', 'Khus Khus', 'Ginger Garlic Paste', 'Full Fat Yogurt', 'Biryani Masala', 'Madras Paste', 'Thai Red Curry Paste', 'Rice Noodles', 'Bulgur Wheat', 'Bun', 'Prunes', 'Baby Plum Tomatoes', 'Extra Virgin Olive Oil', 'Green Olives', 'Massaman Curry Paste', 'Jasmine Rice', 'Chestnuts', 'Wild Mushrooms', 'Truffle Oil', 'Paneer', 'Naan Bread', 'Doubanjiang', 'Fermented Black Beans', 'Sichuan Pepper', 'Goat Meat', 'Mincemeat', 'Mulukhiyah', 'Desiccated Coconut', 'Custard Powder', 'Veal', 'Orange Zest', 'Oxtail', 'Dark Soy Sauce', 'Peanut Oil', 'Beef Gravy', 'Cheese Curds', 'Pilchards', 'Haricot Beans', 'Peanut Cookies', 'Gelatine Leafs', 'Peanut Brittle', 'Peaches', 'Oatmeal', 'Pears', 'Creamed Corn', 'Ciabatta', 'Squid', 'Pitted Black Olives', 'Rigatoni', 'Mackerel', 'Tamarind Ball', 'Canned Tomatoes', 'Wholegrain Bread', 'Baby Aubergine', 'Paella Rice', 'Jam', 'Lean Minced Beef', 'Penne Rigate', 'Italian Seasoning', 'Parmigiano-reggiano', 'Medjool Dates', 'Asparagus', 'Caramel', 'Caramel Sauce', 'Toffee Popcorn', 'Vermicelli Pasta', 'Monkfish', 'Baby Squid', 'Vine Tomatoes', 'Redcurrants', 'Dijon Mustard', 'Tabasco Sauce', 'Salt Cod', 'Ackee', 'English Muffins', 'Smoked Salmon', 'Apples', 'Rhubarb', 'Herring', 'Black Beans', 'Stir-fry Vegetables', 'Brown Rice', 'Thai Green Curry Paste', 'Thai Fish Sauce', 'Horseradish', 'Turkey Mince', 'Capers', 'Tahini', 'Goats Cheese', 'Green Red Lentils', 'Vegan Butter', 'Soya Milk', 'Coco Sugar', 'Flax Eggs', 'Almond Milk', 'Rice Vermicelli', 'Egg Rolls', 'Paccheri Pasta', 'Roasted Vegetables', 'Mixed Grain', 'Wonton Skin', 'Udon Noodles'];
//   const handleCreateIngredients = () => {

//   // Set a manageable size for each batch
//   const batchSize = 50;

//   console.log(`Starting to create ${ingredients.length} ingredients in batches of ${batchSize}...`);

//   // Loop through the ingredients array, taking a "slice" of `batchSize` each time
//   for (let i = 0; i < ingredients.length; i += batchSize) {
//     const batch = ingredients.slice(i, i + batchSize);

//     // Use a setTimeout to add a small delay between requests. This is good practice
//     // to avoid overwhelming the server with simultaneous requests.
//     setTimeout(() => {
//       console.log(`Sending batch starting with: ${batch[0]}`);
      
//       // Call mutate for each smaller batch
//       createIngredients.mutate(
//         { name: batch },
//         {
//           onSuccess: (data) => {
//             // This is the correct way to know a batch succeeded
//             console.log(`Successfully created batch of ${data.count} ingredients!`);
//           },
//           onError: (error) => {
//             // This will catch and log tRPC errors properly
//             console.error(`Failed to create batch starting with: ${batch[0]}`, error);
//           },
//         }
//       );
//     }, i * 20); // 0ms, 1000ms, 2000ms delay etc. (adjust delay as needed)
//   }
// };

//-----------------------Create Allergens--------------------
// //const allergensList_ = ['Wheat', 'Milk', 'Eggs', 'Sulfur Dioxide', 'Celery', 'Soybeans', 'Fish', 'Tree Nuts', 'Mustard', 'Sesame', 'Crustacean Shellfish', 'Peanuts', 'Molluscs'];
// const allergensList_ = ['Lupin'];
//   const handleCreateAllergens = () => {
//     createAllergens.mutate({ name: allergensList_ });
//     console.log("Allergens created successfully");
//   };

//-----------------------Create DietTypes-------------------
  //const allergensList_ = ['Wheat', 'Milk', 'Eggs', 'Sulfur Dioxide', 'Celery', 'Soybeans', 'Fish', 'Tree Nuts', 'Mustard', 'Sesame', 'Crustacean Shellfish', 'Peanuts', 'Molluscs'];
//const dietTypesList_ = ['None', 'Pescatarian', 'Pollotarian', 'Vegetarian', 'Vegan'];
// const dietTypesList_ = ['Halal', 'Keto'];
//   const handleCreateDietTypes = () => {
//     createDietTypes.mutate({ name: dietTypesList_ });
//     console.log("Diet Types created successfully");
//   };


// //-------------------------get all ingredients-----------------
// const handleGetAllIngredients = () => {
//   console.log("Ingredients: ", getAllIngredients.data?.map((ingredient) => ({ name: ingredient.name, id: ingredient.id })))
// }

// //-------------------------get all allergens-----------------
// const handleGetAllAllergens = () => {
//   console.log("Allergens: ", getAllAllergens.data?.map((allergen) => ({ name: allergen.name, id: allergen.id })));
// }

// //-------------------------get all diettypes-----------------
// const handleGetAllDietTypes = () => {
//   console.log("DietTypes: ", getAllDietTypes.data?.map((dietType) => ({ name: dietType.name, id: dietType.id })));
// }

// //--------------------------Create recipes---------------------------
// const [statusMessage, setStatusMessage] = useState("");

//   const { mutate, isPending } = api.recipe.createManyRecipes.useMutation({
//     onSuccess: (data) => {
//       setStatusMessage(`✅ Success! ${data.count} recipes were created.`);
//       console.log("Successfully created recipes:", data);
//     },
//     onError: (error) => {
//       setStatusMessage(`❌ Error: ${error.message}`);
//       console.error("Failed to create recipes:", error);
//     },
//   });

//   const handleSeedDatabase = () => {
//     setStatusMessage("🚀 Seeding database with recipes...");
//     // The entire array is sent in one go!
//     mutate({ recipes: recipesToSeed });
//   };

//front end seeding button for recipes at the beginning
// {/* <button
//         onClick={handleSeedDatabase}
//         disabled={isPending}
//         className="rounded-md bg-blue-600 px-6 py-3 text-lg font-semibold text-white shadow-md transition-all hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-400"
//       >
//         {isPending ? "Seeding..." : `Seed ${recipesToSeed.length} Recipes`}
//       </button>

//       {statusMessage && (
//         <div className="mt-4 w-full max-w-md rounded-md bg-gray-100 p-4 text-center font-mono">
//           <p>{statusMessage}</p>
//         </div>
//       )}                 */}



























//Startup code
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
