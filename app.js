
"use strict";

// 数字を漢数字（大字）へ変換する
const digits = [
    "", "壱", "弐", "参", "四",
    "伍", "六", "七", "八", "九"
];

// 4桁以下の数字を変換する
function convertGroup(number) {
    let result = "";

    const units = [
        [1000, "阡"],
        [100, "百"],
        [10, "拾"],
        [1, ""]
    ];

    for (const [unit, kanjiUnit] of units) {
        const digit = Math.floor(number / unit) % 10;

        if (digit === 0) continue;

        // 千・百・十の「1」は省略する
        if (digit !== 1 || unit === 1) {
            result += digits[digit];
        }

        result += kanjiUnit;
    }

    return result;
}

// 金額全体の変換
function convertAmount(amount) {
    if (!/^[0-9]+$/.test(amount)) {
        return "";
    }

    const number = Number(amount);

    if (!Number.isSafeInteger(number) ||
        number < 1 ||
        number > 999999999) {
        return "";
    }

    const man = Math.floor(number / 10000);
    const remainder = number % 10000;

    let result = "";

    if (man > 0) {
        result += convertGroup(man) + "萬";
    }

    if (remainder > 0) {
        result += convertGroup(remainder);
    }

    return result + "圓";
}

// 入力した内容を画面に反映

function updatePreview() {
    const name = document.getElementById("name").value;
    const amount = document.getElementById("amount").value;

    const result = document.getElementById("kanjiResult");
    const nameResult = document.getElementById("nameResult");

    const converted = convertAmount(amount);

    // 従来の漢数字表示
    result.textContent = converted
        ? "一金" + converted + "也"
        : "金額を入力してください";

    nameResult.textContent = name
        ? name + " 様"
        : "氏名未入力";

    // 新しいB4下げ札プレビュー
    const paperAmount =
        document.getElementById("paperAmount");

    const paperName =
        document.getElementById("paperName");

    paperAmount.textContent = converted
        ? "一金" + converted + "也"
        : "";

    paperName.textContent = name
        ? name + " 様"
        : "";
}

/* 第109段階：氏名・奉納金額の自動保存 */
function autoSaveInputs() {
    try {
        const inputData = {
            name: document.getElementById("name").value,
            amount: document.getElementById("amount").value
        };

        localStorage.setItem(
            "tmj_pwa_input_v1",
            JSON.stringify(inputData)
        );
    } catch (error) {
        console.error("氏名・金額の自動保存失敗:", error);
    }
}

// 入力欄の変更を検知

document.getElementById("name")
    .addEventListener("input", updatePreview);

document.getElementById("amount")
    .addEventListener("input", updatePreview);

// 入力時に氏名・金額を自動保存
document.getElementById("name")
    .addEventListener("input", autoSaveInputs);

document.getElementById("amount")
    .addEventListener("input", autoSaveInputs);

// 起動時にも表示
updatePreview();
