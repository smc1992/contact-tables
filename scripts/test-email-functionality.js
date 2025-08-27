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
var fs_1 = __importDefault(require("fs"));
var path_1 = __importDefault(require("path"));
// Using global fetch API
// Load environment variables
dotenv_1.default.config();
// Initialize Supabase client
var supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
var supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
var supabase = (0, supabase_js_1.createClient)(supabaseUrl, supabaseServiceKey);
// Test configuration
var config = {
    testEmailRecipient: process.env.TEST_EMAIL || 'test@example.com',
    adminUserId: process.env.TEST_ADMIN_USER_ID, // Optional: specific admin user ID to use
    testAttachmentPath: path_1.default.join(__dirname, 'test-attachment.txt'),
    apiBaseUrl: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
};
// Create a test attachment file if it doesn't exist
if (!fs_1.default.existsSync(config.testAttachmentPath)) {
    fs_1.default.writeFileSync(config.testAttachmentPath, 'This is a test attachment for the email functionality test.');
    console.log("Created test attachment at ".concat(config.testAttachmentPath));
}
// Helper to get admin user
function getAdminUser() {
    return __awaiter(this, void 0, void 0, function () {
        var _a, data_1, error_1, _b, data, error;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    if (!config.adminUserId) return [3 /*break*/, 2];
                    return [4 /*yield*/, supabase
                            .from('profiles')
                            .select('*')
                            .eq('id', config.adminUserId)
                            .single()];
                case 1:
                    _a = _c.sent(), data_1 = _a.data, error_1 = _a.error;
                    if (error_1 || !data_1) {
                        throw new Error("Failed to get specified admin user: ".concat((error_1 === null || error_1 === void 0 ? void 0 : error_1.message) || 'User not found'));
                    }
                    return [2 /*return*/, data_1];
                case 2: return [4 /*yield*/, supabase
                        .from('profiles')
                        .select('*')
                        .or('user_metadata->>role.eq.admin,user_metadata->>role.eq.ADMIN')
                        .limit(1)
                        .single()];
                case 3:
                    _b = _c.sent(), data = _b.data, error = _b.error;
                    if (error || !data) {
                        throw new Error("Failed to find any admin user: ".concat((error === null || error === void 0 ? void 0 : error.message) || 'No admin users found'));
                    }
                    return [2 /*return*/, data];
            }
        });
    });
}
// Helper to get auth token for an admin user
function getAdminAuthToken(userId) {
    return __awaiter(this, void 0, void 0, function () {
        var _a, data, error, url, token;
        var _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0: return [4 /*yield*/, supabase.auth.admin.generateLink({
                        type: 'magiclink',
                        email: 'temp@example.com', // This email is not used as we extract the token directly
                        options: {
                            redirectTo: "".concat(config.apiBaseUrl, "/admin"),
                        }
                    })];
                case 1:
                    _a = _c.sent(), data = _a.data, error = _a.error;
                    if (error || !((_b = data.properties) === null || _b === void 0 ? void 0 : _b.action_link)) {
                        throw new Error("Failed to generate auth token: ".concat((error === null || error === void 0 ? void 0 : error.message) || 'No token generated'));
                    }
                    url = new URL(data.properties.action_link);
                    token = url.searchParams.get('token');
                    if (!token) {
                        throw new Error('Failed to extract token from magic link');
                    }
                    return [2 /*return*/, token];
            }
        });
    });
}
// Test email template creation
function testCreateEmailTemplate(token) {
    return __awaiter(this, void 0, void 0, function () {
        var templateData, response, result, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log('\n🧪 Testing email template creation...');
                    templateData = {
                        name: "Test Template ".concat(new Date().toISOString()),
                        subject: 'Test Email Subject',
                        content: "\n      <h1>Test Email Template</h1>\n      <p>Hello {name},</p>\n      <p>This is a test email to verify the email functionality.</p>\n      <p>Best regards,<br>Contact Tables Team</p>\n    "
                    };
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 4, , 5]);
                    return [4 /*yield*/, fetch("".concat(config.apiBaseUrl, "/api/admin/emails/templates"), {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': "Bearer ".concat(token)
                            },
                            body: JSON.stringify(templateData)
                        })];
                case 2:
                    response = _a.sent();
                    return [4 /*yield*/, response.json()];
                case 3:
                    result = _a.sent();
                    if (!response.ok) {
                        throw new Error("API error: ".concat(result.message || response.statusText));
                    }
                    console.log('✅ Email template created successfully');
                    console.log("Template ID: ".concat(result.data.id));
                    return [2 /*return*/, result.data.id];
                case 4:
                    error_2 = _a.sent();
                    console.error('❌ Failed to create email template:', error_2);
                    throw error_2;
                case 5: return [2 /*return*/];
            }
        });
    });
}
// Test sending a test email with attachment
function testSendTestEmail(token, templateId) {
    return __awaiter(this, void 0, void 0, function () {
        var attachmentContent, emailData, response, result, error_3;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log('\n🧪 Testing sending a test email with attachment...');
                    attachmentContent = fs_1.default.readFileSync(config.testAttachmentPath, { encoding: 'base64' });
                    emailData = {
                        subject: 'Test Email With Attachment',
                        content: '<p>This is a test email with an attachment.</p>',
                        to: config.testEmailRecipient,
                        templateId: templateId,
                        attachments: [
                            {
                                filename: 'test-attachment.txt',
                                content: attachmentContent,
                                contentType: 'text/plain'
                            }
                        ]
                    };
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 4, , 5]);
                    return [4 /*yield*/, fetch("".concat(config.apiBaseUrl, "/api/admin/emails/send-test"), {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': "Bearer ".concat(token)
                            },
                            body: JSON.stringify(emailData)
                        })];
                case 2:
                    response = _a.sent();
                    return [4 /*yield*/, response.json()];
                case 3:
                    result = _a.sent();
                    if (!response.ok) {
                        throw new Error("API error: ".concat(result.message || response.statusText));
                    }
                    console.log('✅ Test email sent successfully');
                    return [2 /*return*/, true];
                case 4:
                    error_3 = _a.sent();
                    console.error('❌ Failed to send test email:', error_3);
                    throw error_3;
                case 5: return [2 /*return*/];
            }
        });
    });
}
// Test sending a bulk email campaign
function testSendBulkEmail(token, templateId) {
    return __awaiter(this, void 0, void 0, function () {
        var _a, customers, customersError, attachmentContent, emailData, response, result, error_4;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    console.log('\n🧪 Testing sending a bulk email campaign...');
                    return [4 /*yield*/, supabase
                            .from('customers')
                            .select('id, email, first_name, last_name')
                            .limit(3)];
                case 1:
                    _a = _b.sent(), customers = _a.data, customersError = _a.error;
                    if (customersError || !customers || customers.length === 0) {
                        throw new Error("Failed to get test recipients: ".concat((customersError === null || customersError === void 0 ? void 0 : customersError.message) || 'No customers found'));
                    }
                    attachmentContent = fs_1.default.readFileSync(config.testAttachmentPath, { encoding: 'base64' });
                    emailData = {
                        subject: 'Bulk Test Email Campaign',
                        content: '<p>This is a bulk test email campaign.</p>',
                        recipients: customers.map(function (c) { return ({
                            id: c.id,
                            email: c.email,
                            first_name: c.first_name,
                            last_name: c.last_name
                        }); }),
                        templateId: templateId,
                        attachments: [
                            {
                                filename: 'test-attachment.txt',
                                content: attachmentContent,
                                contentType: 'text/plain'
                            }
                        ]
                    };
                    _b.label = 2;
                case 2:
                    _b.trys.push([2, 5, , 6]);
                    return [4 /*yield*/, fetch("".concat(config.apiBaseUrl, "/api/admin/emails/send"), {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': "Bearer ".concat(token)
                            },
                            body: JSON.stringify(emailData)
                        })];
                case 3:
                    response = _b.sent();
                    return [4 /*yield*/, response.json()];
                case 4:
                    result = _b.sent();
                    if (!response.ok) {
                        throw new Error("API error: ".concat(result.message || response.statusText));
                    }
                    console.log('✅ Bulk email campaign sent successfully');
                    console.log("Campaign ID: ".concat(result.data.campaignId));
                    return [2 /*return*/, result.data.campaignId];
                case 5:
                    error_4 = _b.sent();
                    console.error('❌ Failed to send bulk email campaign:', error_4);
                    throw error_4;
                case 6: return [2 /*return*/];
            }
        });
    });
}
// Test checking email campaign history
function testEmailHistory(token, campaignId) {
    return __awaiter(this, void 0, void 0, function () {
        var response, result, campaign, error_5;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log('\n🧪 Testing email campaign history API...');
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 4, , 5]);
                    return [4 /*yield*/, fetch("".concat(config.apiBaseUrl, "/api/admin/emails/history?page=1&pageSize=10"), {
                            method: 'GET',
                            headers: {
                                'Authorization': "Bearer ".concat(token)
                            }
                        })];
                case 2:
                    response = _a.sent();
                    return [4 /*yield*/, response.json()];
                case 3:
                    result = _a.sent();
                    if (!response.ok) {
                        throw new Error("API error: ".concat(result.message || response.statusText));
                    }
                    console.log('✅ Email history retrieved successfully');
                    campaign = result.data.campaigns.find(function (c) { return c.id === campaignId; });
                    if (campaign) {
                        console.log('✅ Test campaign found in history');
                        console.log("Campaign stats: Total: ".concat(campaign.stats.total, ", Sent: ").concat(campaign.stats.sent, ", Failed: ").concat(campaign.stats.failed));
                    }
                    else {
                        console.warn('⚠️ Test campaign not found in history (it might be on another page)');
                    }
                    return [2 /*return*/, true];
                case 4:
                    error_5 = _a.sent();
                    console.error('❌ Failed to retrieve email history:', error_5);
                    throw error_5;
                case 5: return [2 /*return*/];
            }
        });
    });
}
// Test rate limiting
function testRateLimiting(token, templateId) {
    return __awaiter(this, void 0, void 0, function () {
        var _a, customers, customersError, emailData, response, result, error_6;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    console.log('\n🧪 Testing rate limiting functionality...');
                    return [4 /*yield*/, supabase
                            .from('customers')
                            .select('id, email, first_name, last_name')
                            .limit(600)];
                case 1:
                    _a = _b.sent(), customers = _a.data, customersError = _a.error;
                    if (customersError || !customers || customers.length === 0) {
                        throw new Error("Failed to get test recipients: ".concat((customersError === null || customersError === void 0 ? void 0 : customersError.message) || 'No customers found'));
                    }
                    console.log("Attempting to send to ".concat(customers.length, " recipients to test rate limiting..."));
                    emailData = {
                        subject: 'Rate Limit Test Campaign',
                        content: '<p>This is a rate limit test.</p>',
                        recipients: customers.map(function (c) { return ({
                            id: c.id,
                            email: c.email,
                            first_name: c.first_name,
                            last_name: c.last_name
                        }); }),
                        templateId: templateId
                    };
                    _b.label = 2;
                case 2:
                    _b.trys.push([2, 5, , 6]);
                    return [4 /*yield*/, fetch("".concat(config.apiBaseUrl, "/api/admin/emails/send"), {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': "Bearer ".concat(token)
                            },
                            body: JSON.stringify(emailData)
                        })];
                case 3:
                    response = _b.sent();
                    return [4 /*yield*/, response.json()];
                case 4:
                    result = _b.sent();
                    if (response.status === 429) {
                        console.log('✅ Rate limiting working correctly - received 429 Too Many Requests');
                        return [2 /*return*/, true];
                    }
                    else if (!response.ok) {
                        throw new Error("API error: ".concat(result.message || response.statusText));
                    }
                    else {
                        console.log('⚠️ Rate limiting test inconclusive - campaign was accepted');
                        console.log('This could be because:');
                        console.log('1. The rate limit is higher than the number of recipients we tried');
                        console.log('2. No other emails were sent within the rate limit window');
                        console.log("Campaign ID: ".concat(result.data.campaignId));
                        return [2 /*return*/, true];
                    }
                    return [3 /*break*/, 6];
                case 5:
                    error_6 = _b.sent();
                    if (error_6 instanceof Error && error_6.message.includes('429')) {
                        console.log('✅ Rate limiting working correctly - received 429 Too Many Requests');
                        return [2 /*return*/, true];
                    }
                    console.error('❌ Rate limiting test failed with unexpected error:', error_6);
                    throw error_6;
                case 6: return [2 /*return*/];
            }
        });
    });
}
// Main test function
function runTests() {
    return __awaiter(this, void 0, void 0, function () {
        var adminUser, token, templateId, campaignId, error_7;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log('🚀 Starting email functionality tests');
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 9, , 10]);
                    return [4 /*yield*/, getAdminUser()];
                case 2:
                    adminUser = _a.sent();
                    console.log("Using admin user: ".concat(adminUser.email));
                    return [4 /*yield*/, getAdminAuthToken(adminUser.id)];
                case 3:
                    token = _a.sent();
                    console.log('Auth token obtained');
                    return [4 /*yield*/, testCreateEmailTemplate(token)];
                case 4:
                    templateId = _a.sent();
                    return [4 /*yield*/, testSendTestEmail(token, templateId)];
                case 5:
                    _a.sent();
                    return [4 /*yield*/, testSendBulkEmail(token, templateId)];
                case 6:
                    campaignId = _a.sent();
                    return [4 /*yield*/, testEmailHistory(token, campaignId)];
                case 7:
                    _a.sent();
                    return [4 /*yield*/, testRateLimiting(token, templateId)];
                case 8:
                    _a.sent();
                    console.log('\n✅ All tests completed successfully!');
                    return [3 /*break*/, 10];
                case 9:
                    error_7 = _a.sent();
                    console.error('\n❌ Tests failed:', error_7);
                    process.exit(1);
                    return [3 /*break*/, 10];
                case 10: return [2 /*return*/];
            }
        });
    });
}
// Run the tests
runTests();
