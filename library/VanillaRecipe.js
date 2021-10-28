var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
LIBRARY({
    name: "VanillaRecipe",
    version: 3,
    shared: true,
    api: "CoreEngine"
});
var IS_OLD = getMCPEVersion().main === 28;
var MOD_PREFIX = "mod_";
var BEHAVIOR_NAME = "VanillaRecipe";
var VanillaRecipe;
(function (VanillaRecipe) {
    var resource_path;
    var behavior_path;
    var behavior_recipes_path;
    var recipes = {};
    function setResourcePath(path) {
        if (!IS_OLD)
            return;
        var resPath = path + "/definitions/recipe/";
        if (!resource_path)
            resource_path = resPath;
        FileTools.mkdir(resPath);
        resetRecipes(resPath);
    }
    VanillaRecipe.setResourcePath = setResourcePath;
    function setBehaviorPath(path) {
        if (IS_OLD)
            return;
        if (behavior_path) {
            recursiveDelete(new java.io.File(path + "/" + BEHAVIOR_NAME));
            return;
        }
        behavior_path = path + ("/" + BEHAVIOR_NAME + "/");
        behavior_recipes_path = behavior_path + "recipes/";
        FileTools.mkdir(behavior_recipes_path);
        generateManifestJson();
        resetRecipes(behavior_recipes_path);
    }
    VanillaRecipe.setBehaviorPath = setBehaviorPath;
    function getFileName(recipeName) {
        return MOD_PREFIX + recipeName + ".json";
    }
    VanillaRecipe.getFileName = getFileName;
    function getFilePath(recipeName) {
        return (IS_OLD ? resource_path : behavior_recipes_path) + getFileName(recipeName);
    }
    VanillaRecipe.getFilePath = getFilePath;
    function resetRecipes(path) {
        var files = FileTools.GetListOfFiles(path, "json");
        for (var i in files) {
            var file = files[i];
            if (file.getName().startsWith(MOD_PREFIX)) {
                file.delete();
            }
        }
    }
    VanillaRecipe.resetRecipes = resetRecipes;
    function recursiveDelete(file) {
        if (!file.exists())
            return;
        if (file.isDirectory()) {
            var files = file.listFiles();
            for (var i in files) {
                recursiveDelete(files[i]);
            }
        }
        file.delete();
    }
    function generateUUID() {
        return "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
            .replace(/x/g, function (c) { return (Math.random() * 16 | 0).toString(16); });
    }
    function generateManifestJson() {
        var path = behavior_path + "manifest.json";
        if (FileTools.isExists(path))
            return;
        var description = "Generated by VanillaRecipe";
        var version = [0, 0, 3];
        var manifest = {
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
    function getNumericID(stringID) {
        var stringArray = stringID.split(":");
        if (stringArray.length == 1) {
            return VanillaBlockID[stringID] || VanillaItemID[stringID];
        }
        if (stringArray[0] == "item")
            return ItemID[stringArray[1]];
        if (stringArray[0] == "block")
            return BlockID[stringArray[1]];
        return 0;
    }
    VanillaRecipe.getNumericID = getNumericID;
    var nativeConvertNameID = ModAPI.requireGlobal("requireMethodFromNativeAPI('api.NativeAPI', 'convertNameId')");
    var __isValid__ = true;
    function convertToVanillaID(stringID) {
        if (!getNumericID(stringID)) {
            Logger.Log("ID " + stringID + " is invalid", "ERROR");
            __isValid__ = false;
            return null;
        }
        return "minecraft:" + nativeConvertNameID(stringID.replace(":", "_"));
    }
    VanillaRecipe.convertToVanillaID = convertToVanillaID;
    function generateBlankFile(recipeName) {
        var path = __packdir__ + "assets/definitions/recipe/" + getFileName(recipeName);
        FileTools.WriteText(path, '{"type": "crafting_shaped", "tags": []}');
    }
    function generateJSONRecipe(name, obj) {
        if (IS_OLD)
            generateBlankFile(name);
        FileTools.WriteJSON(getFilePath(name), obj, true);
    }
    VanillaRecipe.generateJSONRecipe = generateJSONRecipe;
    function addWorkbenchRecipeFromJSON(obj) {
        if (Array.isArray(obj.result)) {
            Logger.Log("Recipes with multiple output are not supported in modded workbench", "ERROR");
            return;
        }
        var result = {
            id: getNumericID(obj.result.item),
            count: obj.result.count || 1,
            data: obj.result.data || 0
        };
        if (obj.key) {
            var ingredients = [];
            for (var key in obj.key) {
                ingredients.push(key);
                var item = obj.key[key];
                ingredients.push(getNumericID(item.item), item.data || -1);
            }
            Recipes.addShaped(result, obj.pattern, ingredients);
        }
        else {
            var ingredients = [];
            obj.ingredients.forEach(function (item) {
                ingredients.push({ id: getNumericID(item.item), data: item.data || 0 });
            });
            Recipes.addShapeless(result, ingredients);
        }
    }
    VanillaRecipe.addWorkbenchRecipeFromJSON = addWorkbenchRecipeFromJSON;
    function addCraftingRecipe(name, obj, addToWorkbench) {
        var _a;
        if (recipes[name])
            return;
        recipes[name] = true;
        if (addToWorkbench)
            addWorkbenchRecipeFromJSON(obj);
        var type = obj.type;
        obj.type = "crafting_" + obj.type;
        if (!obj.tags)
            obj.tags = ["crafting_table"];
        __isValid__ = true;
        var items = obj.key || obj.ingredients;
        for (var i in items) {
            items[i].item = convertToVanillaID(items[i].item);
        }
        if (Array.isArray(obj.result)) {
            for (var i in obj.result) {
                var itemStack = obj.result[i];
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
        if (IS_OLD)
            generateJSONRecipe(name, obj);
        else {
            delete obj.type;
            var newObj = (_a = {
                    format_version: "1.12"
                },
                _a["minecraft:recipe_" + type] = __assign({ description: {
                        identifier: "vanilla_recipe:" + name
                    } }, obj),
                _a);
            generateJSONRecipe(name, newObj);
        }
    }
    VanillaRecipe.addCraftingRecipe = addCraftingRecipe;
    function deleteRecipe(name) {
        var recipe = recipes[name];
        if (recipe) {
            var path = getFilePath(name);
            new java.io.File(path).delete();
            recipes[name] = false;
        }
    }
    VanillaRecipe.deleteRecipe = deleteRecipe;
    function addStonecutterRecipe(name, obj) {
        obj.type = "shapeless";
        obj.tags = ["stonecutter"];
        obj.priority = obj.priority || 0;
        addCraftingRecipe(name, obj);
    }
    VanillaRecipe.addStonecutterRecipe = addStonecutterRecipe;
})(VanillaRecipe || (VanillaRecipe = {}));
EXPORT("VanillaRecipe", VanillaRecipe);
