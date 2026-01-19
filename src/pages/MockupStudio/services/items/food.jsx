import React from 'react';

import { Icons } from '../../components/MockupIcons';

export const foodItems = [
  // --- BAKERY (New) ---
  {
    id: 'macaron_box',
    label: 'Macaron Box',
    description: 'Slider box for macarons.',
    formatSpec: 'paper slider box packaging for macarons',
    subjectNoun: 'macaron box',
    icon: <Icons.MacaronBox />,
    category: 'Bakery'
  },
  {
    id: 'donut_box',
    label: 'Donut Box',
    description: 'Flat box for donuts.',
    formatSpec: 'flat paperboard donut box packaging',
    subjectNoun: 'donut box',
    icon: <Icons.DonutBox />,
    category: 'Bakery'
  },
  {
    id: 'cake_box',
    label: 'Cake Box',
    description: 'Square window cake box.',
    formatSpec: 'white square cardboard cake box with clear plastic window',
    subjectNoun: 'cake box',
    icon: <Icons.CakeBox />,
    category: 'Bakery'
  },
  {
    id: 'cupcake_wrapper',
    label: 'Cupcake Wrapper',
    description: 'Patterned cupcake liner.',
    formatSpec: 'cupcake with a patterned paper liner wrapper',
    subjectNoun: 'cupcake wrapper',
    icon: <Icons.Cupcake />,
    category: 'Bakery'
  },
  {
    id: 'bread_bag',
    label: 'Bread Bag',
    description: 'Paper bread loaf bag.',
    formatSpec: 'kraft paper bread loaf packaging bag with window',
    subjectNoun: 'bread bag',
    icon: <Icons.BreadBag />,
    category: 'Bakery'
  },
  {
    id: 'cookie_pouch',
    label: 'Cookie Pouch',
    description: 'Resealable cookie bag.',
    formatSpec: 'resealable plastic cookie packaging pouch',
    subjectNoun: 'cookie pouch',
    icon: <Icons.CoffeeBag />, 
    category: 'Bakery'
  },
  {
    id: 'pie_box',
    label: 'Pie Box',
    description: 'Window pie packaging box.',
    formatSpec: 'kraft cardboard pie box with window',
    subjectNoun: 'pie box',
    icon: <Icons.PieBox />,
    category: 'Bakery'
  },
  {
    id: 'flour_sack',
    label: 'Flour Sack',
    description: 'Paper flour/sugar sack.',
    formatSpec: 'paper flour sack packaging with crimped top',
    subjectNoun: 'flour sack',
    icon: <Icons.FlourBag />,
    category: 'Bakery'
  },

  // --- KITCHEN (New) ---
  {
    id: 'chef_hat',
    label: 'Chef Hat',
    description: 'Professional chef toque.',
    formatSpec: 'white fabric professional chef hat toque',
    subjectNoun: 'chef hat',
    icon: <Icons.ChefHat />,
    category: 'Kitchen'
  },
  {
    id: 'apron_kitchen',
    label: 'Chef Apron',
    description: 'Full bib kitchen apron.',
    formatSpec: 'full bib fabric kitchen chef apron',
    subjectNoun: 'apron',
    icon: <Icons.Apron />, // Reusing generic apron
    category: 'Kitchen'
  },
  {
    id: 'oven_mitt',
    label: 'Oven Mitt',
    description: 'Quilted heat resistant mitt.',
    formatSpec: 'quilted fabric heat resistant oven mitt',
    subjectNoun: 'oven mitt',
    icon: <Icons.OvenMitt />,
    category: 'Kitchen'
  },
  {
    id: 'cutting_board',
    label: 'Cutting Board',
    description: 'Wooden chopping board.',
    formatSpec: 'wooden chopping cutting board',
    subjectNoun: 'cutting board',
    icon: <Icons.CuttingBoard />,
    category: 'Kitchen'
  },
  {
    id: 'kitchen_towel',
    label: 'Tea Towel',
    description: 'Printed cotton kitchen towel.',
    formatSpec: 'folded cotton kitchen tea towel',
    subjectNoun: 'tea towel',
    icon: <Icons.SportsTowel />, // Reusing towel
    category: 'Kitchen'
  },
  {
    id: 'frying_pan',
    label: 'Frying Pan',
    description: 'Cast iron skillet pan.',
    formatSpec: 'cast iron skillet frying pan with branding on the handle',
    subjectNoun: 'frying pan',
    icon: <Icons.FryingPan />,
    category: 'Kitchen'
  },
  {
    id: 'cooking_pot',
    label: 'Cooking Pot',
    description: 'Stainless steel stock pot.',
    formatSpec: 'stainless steel cooking stock pot',
    subjectNoun: 'cooking pot',
    icon: <Icons.CookingPot />,
    category: 'Kitchen'
  },
  {
    id: 'rolling_pin',
    label: 'Rolling Pin',
    description: 'Wooden baking rolling pin.',
    formatSpec: 'wooden baking rolling pin',
    subjectNoun: 'rolling pin',
    icon: <Icons.RollingPin />,
    category: 'Kitchen'
  },
  {
    id: 'chef_knife',
    label: 'Chef Knife',
    description: 'Professional chef knife.',
    formatSpec: 'professional chef knife with laser etched blade',
    subjectNoun: 'chef knife',
    icon: <Icons.Knife />,
    category: 'Kitchen'
  },
  {
    id: 'butcher_paper',
    label: 'Butcher Paper',
    description: 'Roll of butcher paper.',
    formatSpec: 'roll of pink butcher paper',
    subjectNoun: 'butcher paper',
    icon: <Icons.ButcherPaper />,
    category: 'Kitchen'
  },

  // --- DINING (New) ---
  {
    id: 'dinner_plate',
    label: 'Dinner Plate',
    description: 'Ceramic round dinner plate.',
    formatSpec: 'white ceramic round dinner plate',
    subjectNoun: 'dinner plate',
    icon: <Icons.Plate />,
    category: 'Dining'
  },
  {
    id: 'cloth_napkin',
    label: 'Cloth Napkin',
    description: 'Folded linen dinner napkin.',
    formatSpec: 'folded linen cloth dinner napkin',
    subjectNoun: 'napkin',
    icon: <Icons.Napkin />,
    category: 'Dining'
  },
  {
    id: 'placemat',
    label: 'Placemat',
    description: 'Rectangular table placemat.',
    formatSpec: 'rectangular fabric table placemat',
    subjectNoun: 'placemat',
    icon: <Icons.Mousepad />, // Similar shape
    category: 'Dining'
  },
  {
    id: 'coaster_set',
    label: 'Coaster Set',
    description: 'Stack of drink coasters.',
    formatSpec: 'stack of round drink coasters',
    subjectNoun: 'coasters',
    icon: <Icons.Coaster />,
    category: 'Dining'
  },
  {
    id: 'ramen_bowl',
    label: 'Ramen Bowl',
    description: 'Ceramic noodle bowl.',
    formatSpec: 'ceramic ramen noodle bowl',
    subjectNoun: 'ramen bowl',
    icon: <Icons.Bowl />,
    category: 'Dining'
  },
  {
    id: 'serving_platter',
    label: 'Serving Platter',
    description: 'Oval ceramic serving platter.',
    formatSpec: 'white oval ceramic serving platter',
    subjectNoun: 'serving platter',
    icon: <Icons.Platter />,
    category: 'Dining'
  },
  {
    id: 'wine_glass',
    label: 'Wine Glass',
    description: 'Stemmed wine glass.',
    formatSpec: 'elegant stemmed wine glass',
    subjectNoun: 'wine glass',
    icon: <Icons.WineGlass />,
    category: 'Dining'
  },
  {
    id: 'table_tent',
    label: 'Table Tent',
    description: 'Paper table menu tent.',
    formatSpec: 'paper restaurant table tent menu',
    subjectNoun: 'table tent',
    icon: <Icons.TableTent />,
    category: 'Dining'
  },
  {
    id: 'table_runner',
    label: 'Table Runner',
    description: 'Fabric table runner.',
    formatSpec: 'fabric table runner draped on a table',
    subjectNoun: 'table runner',
    icon: <Icons.TableRunner />,
    category: 'Dining'
  },
  {
    id: 'espresso_cup',
    label: 'Espresso Cup',
    description: 'Small espresso cup.',
    formatSpec: 'small ceramic espresso cup on saucer',
    subjectNoun: 'espresso cup',
    icon: <Icons.EspressoCup />,
    category: 'Dining'
  },

  // --- PANTRY / CULINARY (Extended) ---
  {
    id: 'spice_jar',
    label: 'Spice Jar',
    description: 'Glass spice shaker jar.',
    formatSpec: 'glass spice shaker jar with label',
    subjectNoun: 'spice jar',
    icon: <Icons.SpiceJar />,
    category: 'Bottled'
  },
  {
    id: 'honey_jar',
    label: 'Honey Jar',
    description: 'Hexagonal glass honey jar.',
    formatSpec: 'hexagonal glass honey jar',
    subjectNoun: 'honey jar',
    icon: <Icons.HoneyJar />,
    category: 'Bottled'
  },
  {
    id: 'tea_tin',
    label: 'Tea Tin',
    description: 'Metal loose leaf tea tin.',
    formatSpec: 'metal loose leaf tea tin container',
    subjectNoun: 'tea tin',
    icon: <Icons.TeaTin />,
    category: 'Canned'
  },
  {
    id: 'coffee_bag_bean',
    label: 'Coffee Beans',
    description: 'Gusseted coffee bean bag.',
    formatSpec: 'foil gusseted coffee bean packaging bag with valve',
    subjectNoun: 'coffee bag',
    icon: <Icons.CoffeeBag />,
    category: 'Packaging'
  },
  {
    id: 'egg_carton',
    label: 'Egg Carton',
    description: 'Pulp egg carton label.',
    formatSpec: 'fiber pulp egg carton with top label',
    subjectNoun: 'egg carton',
    icon: <Icons.EggCarton />,
    category: 'Packaging'
  },
  {
    id: 'sachet_packet',
    label: 'Sachet',
    description: 'Small condiment packet.',
    formatSpec: 'small tearing condiment sachet packet',
    subjectNoun: 'sachet',
    icon: <Icons.Sachet />,
    category: 'Packaging'
  },

  // --- CANDY ---
  {
    id: 'lollipop',
    label: 'Lollipop',
    description: 'Round lollipop with wrapper.',
    formatSpec: 'round lollipop with plastic wrapper packaging',
    subjectNoun: 'lollipop',
    icon: <Icons.Lollipop />,
    category: 'Candy'
  },
  {
    id: 'candy_bar',
    label: 'Chocolate Bar',
    description: 'Foil chocolate bar wrapper.',
    formatSpec: 'chocolate bar foil wrapper packaging',
    subjectNoun: 'candy bar',
    icon: <Icons.Candy />,
    category: 'Candy'
  },
  {
    id: 'gum_pack',
    label: 'Chewing Gum',
    description: 'Rectangular chewing gum pack.',
    formatSpec: 'rectangular pack of chewing gum',
    subjectNoun: 'gum pack',
    icon: <Icons.Candy />, // Reusing generic candy
    category: 'Candy'
  },
  {
    id: 'gummy_bag',
    label: 'Gummy Bears',
    description: 'Small pouch of gummy candy.',
    formatSpec: 'small plastic pouch bag of gummy bear candy',
    subjectNoun: 'gummy bag',
    icon: <Icons.GummyBear />,
    category: 'Candy'
  },
  {
    id: 'truffle_box',
    label: 'Truffle Box',
    description: 'Fancy chocolate truffle box.',
    formatSpec: 'luxury square chocolate truffle box packaging',
    subjectNoun: 'truffle box',
    icon: <Icons.MacaronBox />, // Similar shape
    category: 'Candy'
  },
  {
    id: 'mint_tin',
    label: 'Mint Tin',
    description: 'Metal mint candy tin.',
    formatSpec: 'metal hinged mint candy tin',
    subjectNoun: 'mint tin',
    icon: <Icons.Tin />,
    category: 'Candy'
  },
  {
    id: 'flow_wrap',
    label: 'Candy Wrapper',
    description: 'Shiny foil flow wrap packaging.',
    formatSpec: 'shiny foil flow wrap candy bar packaging',
    subjectNoun: 'candy wrapper',
    icon: <Icons.FlowWrap />,
    category: 'Candy'
  },

  // --- FREEZER AISLE ---
  {
    id: 'ice_cream_tub',
    label: 'Ice Cream Pint',
    description: 'Paper ice cream pint container.',
    formatSpec: 'paper ice cream pint container packaging',
    subjectNoun: 'ice cream tub',
    icon: <Icons.IceCream />,
    category: 'Freezer'
  },
  {
    id: 'frozen_pizza',
    label: 'Frozen Pizza',
    description: 'Boxed frozen pizza.',
    formatSpec: 'cardboard frozen pizza box packaging',
    subjectNoun: 'frozen pizza box',
    icon: <Icons.Pizza />,
    category: 'Freezer'
  },
  {
    id: 'frozen_meal',
    label: 'Frozen Meal',
    description: 'Rectangular frozen dinner box.',
    formatSpec: 'rectangular cardboard frozen TV dinner box',
    subjectNoun: 'frozen meal box',
    icon: <Icons.FrozenMeal />,
    category: 'Freezer'
  },
  {
    id: 'frozen_veggies',
    label: 'Veggie Bag',
    description: 'Bag of frozen vegetables.',
    formatSpec: 'plastic bag of frozen vegetables',
    subjectNoun: 'frozen veggie bag',
    icon: <Icons.ChipsBag />, // Similar form factor
    category: 'Freezer'
  },
  {
    id: 'popsicle_box',
    label: 'Popsicle Box',
    description: 'Box of ice pops.',
    formatSpec: 'retail cardboard box for ice cream bars',
    subjectNoun: 'popsicle box',
    icon: <Icons.Box />,
    category: 'Freezer'
  },
  {
    id: 'yogurt_cup',
    label: 'Yogurt Cup',
    description: 'Plastic yogurt cup.',
    formatSpec: 'plastic yogurt cup with foil lid',
    subjectNoun: 'yogurt cup',
    icon: <Icons.YogurtCup />,
    category: 'Freezer'
  },

  // --- CANNED AISLE ---
  {
    id: 'soup_can',
    label: 'Soup Can',
    description: 'Standard metal soup can.',
    formatSpec: 'standard metal soup can with paper label',
    subjectNoun: 'soup can',
    icon: <Icons.SoupCan />,
    category: 'Canned'
  },
  {
    id: 'tuna_can',
    label: 'Tuna Can',
    description: 'Short metal tuna fish can.',
    formatSpec: 'short round metal tuna fish can',
    subjectNoun: 'tuna can',
    icon: <Icons.Tin />,
    category: 'Canned'
  },
  {
    id: 'sardine_tin',
    label: 'Sardine Tin',
    description: 'Rectangular sardine tin with tab.',
    formatSpec: 'rectangular metal sardine tin with pull tab',
    subjectNoun: 'sardine tin',
    icon: <Icons.SardineTin />,
    category: 'Canned'
  },
  {
    id: 'mason_jar',
    label: 'Mason Jar',
    description: 'Glass jar for jams or pickles.',
    formatSpec: 'glass mason jar with metal screw lid',
    subjectNoun: 'mason jar',
    icon: <Icons.MasonJar />,
    category: 'Canned'
  },
  {
    id: 'spam_tin',
    label: 'Luncheon Meat',
    description: 'Rectangular luncheon meat tin.',
    formatSpec: 'rectangular metal luncheon meat tin',
    subjectNoun: 'meat tin',
    icon: <Icons.Tin />,
    category: 'Canned'
  },

  // --- SNACK AISLE ---
  {
    id: 'chips_bag',
    label: 'Chips Bag',
    description: 'Foil snack chips bag.',
    formatSpec: 'crinkled foil snack chips bag',
    subjectNoun: 'chips bag',
    icon: <Icons.ChipsBag />,
    category: 'Snacks'
  },
  {
    id: 'cereal_box',
    label: 'Cereal Box',
    description: 'Standard cardboard cereal box.',
    formatSpec: 'standard cardboard cereal box packaging',
    subjectNoun: 'cereal box',
    icon: <Icons.CerealBox />,
    category: 'Snacks'
  },
  {
    id: 'cracker_box',
    label: 'Cracker Box',
    description: 'Rectangular cracker box.',
    formatSpec: 'rectangular cardboard cracker box',
    subjectNoun: 'cracker box',
    icon: <Icons.CrackerBox />,
    category: 'Snacks'
  },
  {
    id: 'granola_bar',
    label: 'Granola Bar',
    description: 'Single granola bar wrapper.',
    formatSpec: 'foil wrapper for a granola bar',
    subjectNoun: 'granola bar',
    icon: <Icons.Granola />,
    category: 'Snacks'
  },
  {
    id: 'popcorn_bucket',
    label: 'Popcorn',
    description: 'Paper popcorn bucket.',
    formatSpec: 'paper movie theater popcorn bucket',
    subjectNoun: 'popcorn bucket',
    icon: <Icons.Popcorn />,
    category: 'Snacks'
  },
  {
    id: 'beef_jerky',
    label: 'Beef Jerky',
    description: 'Resealable jerky bag.',
    formatSpec: 'plastic resealable beef jerky bag',
    subjectNoun: 'jerky bag',
    icon: <Icons.CoffeeBag />, // Similar pouch style
    category: 'Snacks'
  },
  {
    id: 'burger_box',
    label: 'Burger Box',
    description: 'Paperboard clamshell burger box.',
    formatSpec: 'closed paperboard clam-shell burger box',
    subjectNoun: 'burger box',
    icon: <Icons.BurgerBox />,
    category: 'Snacks'
  },
  {
    id: 'takeout_box',
    label: 'Takeout Box',
    description: 'Paper food takeout container.',
    formatSpec: 'paper takeout food box container',
    subjectNoun: 'takeout box',
    icon: <Icons.TakeoutBox />,
    category: 'Snacks'
  },
  {
    id: 'noodle_box',
    label: 'Noodle Box',
    description: 'Paper takeout noodle pail.',
    formatSpec: 'paper takeout noodle pail box',
    subjectNoun: 'noodle box',
    icon: <Icons.NoodleBox />,
    category: 'Snacks'
  },
  {
    id: 'sushi_tray',
    label: 'Sushi Tray',
    description: 'Plastic sushi takeout tray.',
    formatSpec: 'plastic sushi takeout tray with clear lid',
    subjectNoun: 'sushi tray',
    icon: <Icons.SushiTray />,
    category: 'Snacks'
  },
  {
    id: 'pizza_box_open',
    label: 'Pizza Box (Open)',
    description: 'Open pizza box showing lid branding.',
    formatSpec: 'open cardboard pizza box showing the inner lid branding and grease resistant liner',
    subjectNoun: 'pizza box',
    icon: <Icons.PizzaBoxOpen />,
    category: 'Snacks'
  },
  {
    id: 'sandwich_wrap',
    label: 'Deli Wrap',
    description: 'Deli sandwich paper wrap.',
    formatSpec: 'deli sandwich wrapped in printed greaseproof paper',
    subjectNoun: 'sandwich wrap',
    icon: <Icons.SandwichWrap />,
    category: 'Snacks'
  },

  // --- BOTTLED AISLE ---
  {
    id: 'olive_oil',
    label: 'Olive Oil',
    description: 'Tall glass olive oil bottle.',
    formatSpec: 'tall dark glass olive oil bottle',
    subjectNoun: 'olive oil bottle',
    icon: <Icons.OliveOil />,
    category: 'Bottled'
  },
  {
    id: 'hot_sauce',
    label: 'Hot Sauce',
    description: 'Glass hot sauce bottle.',
    formatSpec: 'glass hot sauce bottle with screw cap',
    subjectNoun: 'hot sauce bottle',
    icon: <Icons.HotSauce />,
    category: 'Bottled'
  },
  {
    id: 'maple_syrup',
    label: 'Maple Syrup',
    description: 'Glass syrup bottle with handle.',
    formatSpec: 'glass maple syrup bottle with small handle',
    subjectNoun: 'syrup bottle',
    icon: <Icons.OliveOil />, // Reusing bottle shape
    category: 'Bottled'
  },
  {
    id: 'salad_dressing',
    label: 'Salad Dressing',
    description: 'Plastic dressing bottle.',
    formatSpec: 'plastic salad dressing bottle',
    subjectNoun: 'dressing bottle',
    icon: <Icons.PumpBottle />, // Close enough shape without pump
    category: 'Bottled'
  },
  {
    id: 'bbq_sauce',
    label: 'BBQ Sauce',
    description: 'Glass barbecue sauce bottle.',
    formatSpec: 'glass barbecue sauce bottle',
    subjectNoun: 'BBQ sauce bottle',
    icon: <Icons.VitaminBottle />, // Reusing wide bottle
    category: 'Bottled'
  },

  // --- DRINK AISLE ---
  {
    id: 'soda_can',
    label: 'Soda Can',
    description: '12oz aluminum beverage can.',
    formatSpec: '12oz aluminum beverage can with cold condensation drops',
    subjectNoun: 'soda can',
    icon: <Icons.SodaCan />,
    category: 'Drinks'
  },
  {
    id: 'energy_drink',
    label: 'Energy Drink',
    description: 'Slim aluminum energy drink can.',
    formatSpec: 'tall slim aluminum energy drink can',
    subjectNoun: 'energy drink can',
    icon: <Icons.EnergyDrink />,
    category: 'Drinks'
  },
  {
    id: 'glass_soda',
    label: 'Glass Soda',
    description: 'Classic glass soda bottle.',
    formatSpec: 'classic glass soda bottle with metal cap and condensation',
    subjectNoun: 'soda bottle',
    icon: <Icons.Beer />, 
    category: 'Drinks'
  },
  {
    id: 'water_bottle_plastic',
    label: 'Water Bottle',
    description: 'Plastic water bottle.',
    formatSpec: 'clear plastic disposable water bottle',
    subjectNoun: 'water bottle',
    icon: <Icons.WaterBottle />,
    category: 'Drinks'
  },
  {
    id: 'milk_carton',
    label: 'Milk Carton',
    description: 'Paperboard milk carton.',
    formatSpec: 'paperboard milk carton',
    subjectNoun: 'milk carton',
    icon: <Icons.MilkCarton />,
    category: 'Drinks'
  },
  {
    id: 'two_liter',
    label: '2L Bottle',
    description: 'Large 2-liter soda bottle.',
    formatSpec: '2-liter plastic soda bottle',
    subjectNoun: '2L bottle',
    icon: <Icons.TwoLiter />,
    category: 'Drinks'
  },
  {
    id: 'juice_box',
    label: 'Juice Box',
    description: 'Tetra Pak juice box.',
    formatSpec: 'tetra pak juice box beverage packaging',
    subjectNoun: 'juice box',
    icon: <Icons.Juice />,
    category: 'Drinks'
  },
  {
    id: 'coffee_cup',
    label: 'Coffee Cup',
    description: 'Paper takeout cup with sleeve.',
    formatSpec: 'paper takeaway coffee cup with lid and sleeve',
    subjectNoun: 'coffee cup',
    icon: <Icons.CoffeePaperCup />,
    category: 'Drinks'
  },
  {
    id: 'bubble_tea',
    label: 'Bubble Tea',
    description: 'Plastic cup with boba and straw.',
    formatSpec: 'clear plastic bubble tea cup with boba pearls and wide straw',
    subjectNoun: 'bubble tea cup',
    icon: <Icons.BubbleTea />,
    category: 'Drinks'
  },
  {
    id: 'wine_bottle',
    label: 'Wine Bottle',
    description: 'Glass wine bottle with label.',
    formatSpec: 'green glass wine bottle with paper label',
    subjectNoun: 'wine bottle',
    icon: <Icons.WineBottle />,
    category: 'Drinks'
  },
  {
    id: 'liquor_bottle',
    label: 'Liquor Bottle',
    description: 'Square glass liquor bottle.',
    formatSpec: 'square glass liquor spirit bottle',
    subjectNoun: 'liquor bottle',
    icon: <Icons.LiquorBottle />,
    category: 'Drinks'
  },
  {
    id: 'beer_bottle',
    label: 'Beer Bottle',
    description: 'Amber glass beer bottle.',
    formatSpec: 'amber glass beer bottle with condensation',
    subjectNoun: 'beer bottle',
    icon: <Icons.Beer />,
    category: 'Drinks'
  },
  {
    id: 'tea_bag',
    label: 'Tea Bag',
    description: 'Individual tea bag tag.',
    formatSpec: 'tea bag with paper tag',
    subjectNoun: 'tea bag tag',
    icon: <Icons.TeaBag />,
    category: 'Drinks'
  },
  {
    id: 'juice_pouch',
    label: 'Juice Pouch',
    description: 'Foil drink pouch.',
    formatSpec: 'silver foil drink pouch with straw',
    subjectNoun: 'juice pouch',
    icon: <Icons.JuicePouch />,
    category: 'Drinks'
  },
  {
    id: 'beer_glass',
    label: 'Pint Glass',
    description: 'Standard beer pint glass.',
    formatSpec: 'pint glass with foamy beer',
    subjectNoun: 'pint glass',
    icon: <Icons.BeerGlass />,
    category: 'Drinks'
  },
  {
    id: 'shot_glass',
    label: 'Shot Glass',
    description: 'Small glass shot glass.',
    formatSpec: 'clear glass shot glass',
    subjectNoun: 'shot glass',
    icon: <Icons.ShotGlass />,
    category: 'Drinks'
  }
];