"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var supabase_js_1 = require("@supabase/supabase-js");
var dotenv_1 = __importDefault(require("dotenv"));
var path_1 = __importDefault(require("path"));
// Lade Umgebungsvariablen aus .env.local
dotenv_1.default.config({ path: path_1.default.resolve(process.cwd(), '.env.local') });
var supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
var supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Umgebungsvariablen NEXT_PUBLIC_SUPABASE_URL und SUPABASE_SERVICE_ROLE_KEY müssen gesetzt sein');
    process.exit(1);
}
// Erstelle Supabase-Client mit Service-Rolle für Admin-Zugriff
var supabase = (0, supabase_js_1.createClient)(supabaseUrl, supabaseServiceKey);
function createMissingProfiles() {
    return __awaiter(this, void 0, void 0, function () {
        var _a, usersWithoutProfiles, error, _b, allUsers, usersError, _c, allProfiles, profilesError, profileIds_1, usersWithoutProfiles_3, successCount, errorCount, _i, usersWithoutProfiles_1, user, _d, data, insertError, e_1, successCount, errorCount, _e, usersWithoutProfiles_2, user, _f, data, insertError, e_2, error_1;
        return __generator(this, function (_g) {
            switch (_g.label) {
                case 0:
                    _g.trys.push([0, 18, , 19]);
                    console.log('Suche nach Benutzern ohne Profile...');
                    return [4 /*yield*/, supabase.rpc('get_users_without_profiles')];
                case 1:
                    _a = _g.sent(), usersWithoutProfiles = _a.data, error = _a.error;
                    if (!error) return [3 /*break*/, 10];
                    // Wenn die RPC-Funktion nicht existiert, verwenden wir eine alternative Abfrage
                    console.log('RPC-Funktion nicht gefunden, verwende alternative Abfrage...');
                    return [4 /*yield*/, supabase.auth.admin.listUsers()];
                case 2:
                    _b = _g.sent(), allUsers = _b.data, usersError = _b.error;
                    if (usersError) {
                        throw usersError;
                    }
                    return [4 /*yield*/, supabase
                            .from('profiles')
                            .select('id')];
                case 3:
                    _c = _g.sent(), allProfiles = _c.data, profilesError = _c.error;
                    if (profilesError) {
                        throw profilesError;
                    }
                    profileIds_1 = new Set(allProfiles.map(function (profile) { return profile.id; }));
                    usersWithoutProfiles_3 = allUsers.users.filter(function (user) { return !profileIds_1.has(user.id); });
                    console.log("Gefunden: ".concat(usersWithoutProfiles_3.length, " Benutzer ohne Profil"));
                    successCount = 0;
                    errorCount = 0;
                    _i = 0, usersWithoutProfiles_1 = usersWithoutProfiles_3;
                    _g.label = 4;
                case 4:
                    if (!(_i < usersWithoutProfiles_1.length)) return [3 /*break*/, 9];
                    user = usersWithoutProfiles_1[_i];
                    _g.label = 5;
                case 5:
                    _g.trys.push([5, 7, , 8]);
                    return [4 /*yield*/, supabase
                            .from('profiles')
                            .insert({
                            id: user.id,
                            email: user.email,
                            role: 'CUSTOMER',
                            created_at: new Date().toISOString(),
                            updated_at: new Date().toISOString()
                        })];
                case 6:
                    _d = _g.sent(), data = _d.data, insertError = _d.error;
                    if (insertError) {
                        console.error("Fehler beim Erstellen des Profils f\u00FCr ".concat(user.email, ":"), insertError);
                        errorCount++;
                    }
                    else {
                        console.log("Profil f\u00FCr ".concat(user.email, " erfolgreich erstellt"));
                        successCount++;
                    }
                    return [3 /*break*/, 8];
                case 7:
                    e_1 = _g.sent();
                    console.error("Unerwarteter Fehler beim Erstellen des Profils f\u00FCr ".concat(user.email, ":"), e_1);
                    errorCount++;
                    return [3 /*break*/, 8];
                case 8:
                    _i++;
                    return [3 /*break*/, 4];
                case 9:
                    console.log("Zusammenfassung: ".concat(successCount, " Profile erstellt, ").concat(errorCount, " Fehler"));
                    return [3 /*break*/, 17];
                case 10:
                    // Wenn die RPC-Funktion existiert, verwenden wir deren Ergebnisse
                    console.log("Gefunden: ".concat(usersWithoutProfiles.length, " Benutzer ohne Profil"));
                    successCount = 0;
                    errorCount = 0;
                    _e = 0, usersWithoutProfiles_2 = usersWithoutProfiles;
                    _g.label = 11;
                case 11:
                    if (!(_e < usersWithoutProfiles_2.length)) return [3 /*break*/, 16];
                    user = usersWithoutProfiles_2[_e];
                    _g.label = 12;
                case 12:
                    _g.trys.push([12, 14, , 15]);
                    return [4 /*yield*/, supabase
                            .from('profiles')
                            .insert({
                            id: user.id,
                            email: user.email,
                            role: 'CUSTOMER',
                            created_at: new Date().toISOString(),
                            updated_at: new Date().toISOString()
                        })];
                case 13:
                    _f = _g.sent(), data = _f.data, insertError = _f.error;
                    if (insertError) {
                        console.error("Fehler beim Erstellen des Profils f\u00FCr ".concat(user.email, ":"), insertError);
                        errorCount++;
                    }
                    else {
                        console.log("Profil f\u00FCr ".concat(user.email, " erfolgreich erstellt"));
                        successCount++;
                    }
                    return [3 /*break*/, 15];
                case 14:
                    e_2 = _g.sent();
                    console.error("Unerwarteter Fehler beim Erstellen des Profils f\u00FCr ".concat(user.email, ":"), e_2);
                    errorCount++;
                    return [3 /*break*/, 15];
                case 15:
                    _e++;
                    return [3 /*break*/, 11];
                case 16:
                    console.log("Zusammenfassung: ".concat(successCount, " Profile erstellt, ").concat(errorCount, " Fehler"));
                    _g.label = 17;
                case 17: return [3 /*break*/, 19];
                case 18:
                    error_1 = _g.sent();
                    console.error('Fehler beim Erstellen fehlender Profile:', error_1);
                    return [3 /*break*/, 19];
                case 19: return [2 /*return*/];
            }
        });
    });
}
// Führe das Skript aus
createMissingProfiles()
    .then(function () {
    console.log('Skript abgeschlossen');
    process.exit(0);
})
    .catch(function (error) {
    console.error('Unerwarteter Fehler:', error);
    process.exit(1);
});
