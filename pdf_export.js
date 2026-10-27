"use strict";

// 第87段階：B4 PDF直接生成・試験版
// 既存の印刷機能には影響させない

async function createB4DirectPDF() {
    let captureRoot = null;

    try {
        if (typeof html2canvas !== "function" ||
            !window.jspdf?.jsPDF) {
            throw new Error("PDFライブラリが読み込まれていません。");
        }

        const original = document.getElementById("b4Paper");

        if (!original) {
            throw new Error("B4プレビューが見つかりません。");
        }

        // フォントの読み込みを待つ
        await document.fonts.ready;

        // 表示中のB4プレビューを複製
        captureRoot = document.createElement("div");

        Object.assign(captureRoot.style, {
            position: "fixed",
            left: "0",
            top: "0",
            width: "257mm",
            height: "364mm",
            overflow: "hidden",
            pointerEvents: "none",
            zIndex: "-1"
        });

        const paper = original.cloneNode(true);

        Object.assign(paper.style, {
            position: "relative",
            top: "0",
            left: "0",
            transform: "none",
            border: "none",
            boxShadow: "none",
            background: "#ffffff",
            margin: "0"
        });

        const safeArea = paper.querySelector(".safe-area");

        if (safeArea) {
            safeArea.style.display = "none";
        }

        // 第88段階：PDF画像化時の「奉納」縦書き対策
        const hounou = paper.querySelector(".hounou");

        if (hounou) {
            hounou.style.writingMode = "horizontal-tb";
            hounou.style.whiteSpace = "normal";
            hounou.style.display = "flex";
            hounou.style.flexDirection = "column";
            hounou.style.lineHeight = "1";
            hounou.style.alignItems = "center";

            hounou.replaceChildren(
                ...Array.from("奉納", char => {
                    const span = document.createElement("span");
                    span.textContent = char;
                    return span;
                })
            );
        }

        captureRoot.appendChild(paper);
        document.body.appendChild(captureRoot);

        // まずはiPhoneへの負荷を抑えた解像度で試験
        const canvas = await html2canvas(paper, {
            backgroundColor: "#ffffff",
            scale: 1.5,
            useCORS: false,
            logging: false,
            scrollX: 0,
            scrollY: 0
        });

        const imageData = canvas.toDataURL("image/png");

        // B4縦（257 × 364mm）1ページ
        const { jsPDF } = window.jspdf;

        const pdf = new jsPDF({
            orientation: "portrait",
            unit: "mm",
            format: [257, 364],
            compress: true
        });

        pdf.addImage(imageData, "PNG", 0, 0, 257, 364);

        pdf.save("玉川神社_下げ札_B4_試験.pdf");

    } catch (error) {
        console.error("B4 PDF直接生成エラー:", error);

        alert(
            "B4 PDF直接生成に失敗しました。\n" +
            (error?.message || String(error))
        );

    } finally {
        if (captureRoot) {
            captureRoot.remove();
        }
    }
}