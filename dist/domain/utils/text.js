"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeText = normalizeText;
exports.isBlank = isBlank;
function normalizeText(value) {
    return String(value ?? "").trim();
}
function isBlank(value) {
    return normalizeText(value) === "";
}
