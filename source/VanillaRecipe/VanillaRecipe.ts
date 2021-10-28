LIBRARY({
	name: "VanillaRecipe",
	version: 3,
	shared: true,
	api: "CoreEngine"
});

const IS_OLD = getMCPEVersion().main === 28;
const MOD_PREFIX = "mod_";
const BEHAVIOR_NAME = "VanillaRecipe";

namespace VanillaRecipe {
	type RecipeFormat = {
		type?: string,
		tags?: string[],
		priority?: number,
		pattern?: string[],
		key?: {
			[key: string]: {item: string, data?: number, count?: number}
		},
		ingredients?: {item: string, data?: number, count?: number}[],
		result: {item: string, data?: number, count?: number} | {item: string, data?: number, count?: number}[];
	}

	let resource_path: string;
	let behavior_path: string;
	let behavior_recipes_path: string;
	let recipes = {};

	export function setResourcePath(path: string): void {
		if (!IS_OLD) return;
		const resPath = path + "/definitions/recipe/";
		if (!resource_path) resource_path = resPath;
		FileTools.mkdir(resPath);
		resetRecipes(resPath);
	}

	export function setBehaviorPath(path: string): void {
		if (IS_OLD) return;
		if (behavior_path) {
			recursiveDelete(new java.io.File(path+ "/" + BEHAVIOR_NAME));
			return;
		}
		behavior_path = path + `/${BEHAVIOR_NAME}/`;
		behavior_recipes_path = behavior_path + "recipes/";
		FileTools.mkdir(behavior_recipes_path);
		generateManifestJson();
		resetRecipes(behavior_recipes_path);
	}

	export function getFileName(recipeName: string): string {
		return MOD_PREFIX + recipeName + ".json";
	}

	export function getFilePath(recipeName: string): string {
		return (IS_OLD ? resource_path : behavior_recipes_path) + getFileName(recipeName);
	}

	export function resetRecipes(path: string): void {
		let files = FileTools.GetListOfFiles(path, "json");
		for (let i in files) {
			let file = files[i];
			if (file.getName().startsWith(MOD_PREFIX)) {
				file.delete();
			}
		}
	}

	function recursiveDelete(file: java.io.File): void {
        if (!file.exists())
            return;

        if (file.isDirectory()) {
			let files = file.listFiles();
            for (let i in files) {
                recursiveDelete(files[i]);
            }
        }
        file.delete();
	}

	function generateUUID(): string {
		return "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
		.replace(/x/g, (c) => (Math.random() * 16 | 0).toString(16));
	}

	function generateManifestJson(): void {
		const path = behavior_path + "manifest.json";
		if (FileTools.isExists(path)) return;

		const description =  "Generated by VanillaRecipe";
		const version = [0, 0, 3];
		const manifest = {
			format_version: 2,
			header: {
				description: description,
				name: BEHAVIOR_NAME,
				uuid: generateUUID(),
				version: version,
				min_engine_version: [1, 16, 0]
			},
			modules: [
				{
					description: description,
					type: "data",
					uuid: generateUUID(),
					version: version
				}
			]
		};
		FileTools.WriteJSON(path, manifest, true);
	}

	export function getNumericID(stringID: string): number {
		let stringArray = stringID.split(":");
		if (stringArray.length == 1) {
			return VanillaBlockID[stringID] || VanillaItemID[stringID];
		}
		if (stringArray[0] == "item") return ItemID[stringArray[1]];
		if (stringArray[0] == "block") return BlockID[stringArray[1]];
		return 0;
	}

	const nativeConvertNameID = ModAPI.requireGlobal("requireMethodFromNativeAPI('api.NativeAPI', 'convertNameId')");

	let __isValid__ = true;
	export function convertToVanillaID(stringID: string): string {
		if (!getNumericID(stringID)) {
			Logger.Log("ID " + stringID + " is invalid", "ERROR");
			__isValid__ = false;
			return null;
		}
		return "minecraft:" + nativeConvertNameID(stringID.replace(":", "_"));
	}

	function generateBlankFile(recipeName: string): void {
		let path = __packdir__ + "assets/definitions/recipe/" + getFileName(recipeName);
		FileTools.WriteText(path, '{"type": "crafting_shaped", "tags": []}');
	}

	export function generateJSONRecipe(name: string, obj: any): void {
		if (IS_OLD) generateBlankFile(name);
		FileTools.WriteJSON(getFilePath(name), obj, true);
	}

	export function addWorkbenchRecipeFromJSON(obj: RecipeFormat): void {
		if (Array.isArray(obj.result)) {
			Logger.Log("Recipes with multiple output are not supported in modded workbench", "ERROR");
			return;
		}
		var result = {
			id: getNumericID(obj.result.item),
			count: obj.result.count || 1,
			data: obj.result.data || 0
		}
		if (obj.key) {
			var ingredients = [];
			for (let key in obj.key) {
				ingredients.push(key);
				let item = obj.key[key];
				ingredients.push(getNumericID(item.item), item.data || -1);
			}
			Recipes.addShaped(result, obj.pattern, ingredients)
		}
		else {
			var ingredients = [];
			obj.ingredients.forEach(function(item) {
				ingredients.push({id: getNumericID(item.item), data: item.data || 0});
			});
			Recipes.addShapeless(result, ingredients);
		}
	}

	export function addCraftingRecipe(name: string, obj: RecipeFormat, addToWorkbench?: boolean): void {
		if (recipes[name]) return;
		recipes[name] = true;

		if (addToWorkbench) addWorkbenchRecipeFromJSON(obj);

		const type = obj.type;
		obj.type = "crafting_" + obj.type;
		if (!obj.tags) obj.tags = [ "crafting_table" ];

		__isValid__ = true;
		let items = obj.key || obj.ingredients;
		for (let i in items) {
			items[i].item = convertToVanillaID(items[i].item);
		}
		if (Array.isArray(obj.result)) {
			for (let i in obj.result) {
				let itemStack = obj.result[i];
				itemStack.item = convertToVanillaID(itemStack.item);
			}
		}
		else {
			obj.result.item = convertToVanillaID(obj.result.item);
		}

		if (!__isValid__) {
			Logger.Log("Failed to add JSON recipe: " + name, "ERROR");
			return;
		}

		if (IS_OLD) generateJSONRecipe(name, obj);
		else {
			delete obj.type;
			const newObj = {
				format_version: "1.12",
				[`minecraft:recipe_${type}`]: {
					description: {
						identifier: `vanilla_recipe:${name}`
					},
					...obj
				}
			}
			generateJSONRecipe(name, newObj);
		}
	}

	export function deleteRecipe(name: string): void {
		let recipe = recipes[name];
		if (recipe) {
			let path = getFilePath(name);
			new java.io.File(path).delete();
			recipes[name] = false;
		}
	}

	export function addStonecutterRecipe(name: string, obj: RecipeFormat): void {
		obj.type = "shapeless";
		obj.tags = [ "stonecutter" ];
		obj.priority = obj.priority || 0;
		addCraftingRecipe(name, obj);
	}
}

EXPORT("VanillaRecipe", VanillaRecipe);
