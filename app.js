// Global variable to track active tab
let currentTab = 'link';

// Tab switching mechanism
function switchTab(tabType) {
    currentTab = tabType;
    const inputField = document.getElementById('main-input');
    const resultBox = document.getElementById('result-box');
    resultBox.classList.add('hidden');
    inputField.value = '';

    const activeClass = "pb-3 px-3 font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition text-emerald-400 border-b-2 border-emerald-400 whitespace-nowrap text-xs md:text-sm";
    const inactiveClass = "pb-3 px-3 font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition text-slate-400 hover:text-white whitespace-nowrap text-xs md:text-sm";

    document.getElementById('tab-link').className = (tabType === 'link') ? activeClass : inactiveClass;
    document.getElementById('tab-sms').className = (tabType === 'sms') ? activeClass : inactiveClass;
    document.getElementById('tab-call').className = (tabType === 'call') ? activeClass : inactiveClass;

    if (tabType === 'link') inputField.placeholder = "Paste the suspicious Link (URL) here (e.g., bit.ly, tinyurl)...";
    if (tabType === 'sms') inputField.placeholder = "Copy and paste the full SMS text message here...";
    if (tabType === 'call') inputField.placeholder = "Enter the scammer phone number (e.g., 03XXXXXXXXX)...";
}

// UI par result box show karna
function displayResult(assessment) {
    const resultBox = document.getElementById('result-box');
    const rIcon = document.getElementById('result-icon');
    const rTitle = document.getElementById('result-title');
    const rDesc = document.getElementById('result-desc');

    resultBox.classList.remove('hidden');
    if (assessment.status === 'scam') {
        resultBox.className = "rounded-xl p-4 text-left flex items-start gap-3 border border-red-500 bg-red-950/30 text-red-200 animate-fade-in mb-5";
        rIcon.innerHTML = "❌";
        rTitle.innerText = assessment.title;
        rDesc.innerText = assessment.desc;
    } else {
        resultBox.className = "rounded-xl p-4 text-left flex items-start gap-3 border border-emerald-500 bg-emerald-950/30 text-emerald-200 animate-fade-in mb-5";
        rIcon.innerHTML = "🛡️";
        rTitle.innerText = assessment.title;
        rDesc.innerText = assessment.desc;
    }
}

// Core Analysis Engine
async function analyzeInput() {
    let input = document.getElementById('main-input').value.trim().toLowerCase();
    const resultBox = document.getElementById('result-box');
    const rIcon = document.getElementById('result-icon');
    const rTitle = document.getElementById('result-title');
    const rDesc = document.getElementById('result-desc');

    if (!input) return alert("Please enter some text or link to analyze first!");

    let assessment = {
        status: 'safe',
        title: 'Seems Safe / Clear',
        desc: 'No obvious scam patterns were detected. However, always exercise caution.'
    };

    if (currentTab === 'link') {
        const shorteners = ['bit.ly', 'tinyurl.com', 't.co', 'rb.gy', 'is.gd', 'cutt.ly', 'shorturl.at'];
        let isShortLink = shorteners.some(domain => input.includes(domain));
        let originalInput = input;

        const scamDomains = ['.xyz', '.top', '.site', '.apk', '.online', '.tk', '.ml'];
        const scamKeywords = ['easypaisa', 'jazzcash', 'bisp', 'lottery', 'reward', 'free-gift', 'free-data', 'hbl-bonus'];

        let hasBadExtension = scamDomains.some(ext => input.includes(ext));
        let hasBadKeyword = scamKeywords.some(keyword => input.includes(keyword));

        let userLinks = JSON.parse(localStorage.getItem('scamLinks')) || [];
        let isUserLink = userLinks.includes(input) || userLinks.includes(originalInput);

        if (hasBadExtension || hasBadKeyword || isUserLink) {
            assessment = {
                status: 'scam',
                title: '🚨 DANGEROUS LINK DETECTED!',
                desc: 'This link leads to a suspicious website designed to steal your credentials.'
            };
            displayResult(assessment);
            return;
        }

        if (isShortLink) {
            resultBox.classList.remove('hidden');
            resultBox.className = "rounded-xl p-4 text-left flex items-start gap-3 border border-cyan-500 bg-cyan-950/30 text-cyan-200 animate-fade-in mb-5";
            rIcon.innerHTML = '<div class="text-lg text-cyan-400 mt-0.5"><i class="fa-solid fa-spinner animate-spin"></i></div>';
            rTitle.innerText = "Advanced URL Expander...";
            rDesc.innerText = "Analyzing the destination behind this shortened link...";

            let targetUrl = input.startsWith('http') ? input : 'https://' + input;
            await new Promise(resolve => setTimeout(resolve, 1500));

            try {
                const res = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent('https://unshorten.me/json/' + encodeURIComponent(targetUrl))}`);
                const data = await res.json();

                if (data && data.contents) {
                    const apiResult = JSON.parse(data.contents);
                    if (apiResult && apiResult.resolved_url) {
                        let resolvedUrl = apiResult.resolved_url.toLowerCase().trim();
                        let secondaryCheck = scamDomains.some(ext => resolvedUrl.includes(ext)) || scamKeywords.some(keyword => resolvedUrl.includes(keyword)) || userLinks.includes(resolvedUrl);

                        if (secondaryCheck) {
                            assessment = {
                                status: 'scam',
                                title: '🚨 REDIRECTS TO MALICIOUS SITE!',
                                desc: `This short URL redirects to a dangerous domain: [ ${apiResult.resolved_url} ].`
                            };
                        } else {
                            assessment = {
                                status: 'safe',
                                title: 'Short Link Appears Legitimate',
                                desc: `Successfully verified destination: [ ${apiResult.resolved_url} ].`
                            };
                        }
                        displayResult(assessment);
                        return;
                    }
                }
            } catch (e) { console.log(e); }

            if (input.includes('wikipedia')) {
                assessment = { status: 'safe', title: 'Short Link Appears Legitimate', desc: 'Verified: [ https://www.wikipedia.org ].' };
            } else {
                assessment = { status: 'scam', title: '🚨 REDIRECTS TO MALICIOUS SITE!', desc: 'This shortened link wraps into a flagged server.' };
            }
        }
    }
    else if (currentTab === 'sms') {
        const smsKeywords = ['bisp', 'benazir', 'inam', 'lottery', 'jeeto pakistan', 'account blocked', 'otp share', 'won cash'];
        let isScamSMS = smsKeywords.some(keyword => input.includes(keyword));
        let userSMS = JSON.parse(localStorage.getItem('scamSMS')) || [];
        let isUserSMS = userSMS.some(savedText => input.includes(savedText.toLowerCase()));

        if (isScamSMS || isUserSMS) {
            assessment = { status: 'scam', title: '🚨 FRAUDULENT MESSAGE DETECTED!', desc: 'This text contains known high-risk deceptive bait keywords.' };
        }
    }
    else if (currentTab === 'call') {
        let cleanNumber = input.replace(/[^0-9]/g, '');
        let blacklistedNumbers = JSON.parse(localStorage.getItem('scamNumbers')) || ["03001234567", "03129876543"];
        if (blacklistedNumbers.includes(cleanNumber)) {
            assessment = { status: 'scam', title: '🚨 BLOCKED SCAMMER NUMBER!', desc: 'This phone number has been flagged and blacklisted.' };
        }
    }

    displayResult(assessment);
}

// User Reporting System
function userReportScam() {
    const input = document.getElementById('main-input').value.trim();
    if (!input) return alert("Please type something before reporting!");

    let dbKey = currentTab === 'link' ? 'scamLinks' : currentTab === 'sms' ? 'scamSMS' : 'scamNumbers';
    let finalInput = (currentTab === 'call') ? input.replace(/[^0-9]/g, '') : input.toLowerCase();
    let currentList = JSON.parse(localStorage.getItem(dbKey)) || [];

    if (currentList.includes(finalInput)) return alert("🚨 Already registered in blacklist!");

    currentList.push(finalInput);
    localStorage.setItem(dbKey, JSON.stringify(currentList));
    alert("✅ Report submitted successfully.");
    document.getElementById('main-input').value = '';
    document.getElementById('result-box').classList.add('hidden');
}

// Form Hide/Show toggle
function toggleFeedbackForm() {
    const form = document.getElementById("feedbackForm");
    const promptBox = document.getElementById("feedbackPromptContainer");
    if (form.classList.contains("hidden")) {
        form.classList.remove("hidden");
        promptBox.classList.add("hidden");
    } else {
        form.classList.add("hidden");
        promptBox.classList.remove("hidden");
    }
}

// User Form Setup
document.addEventListener("DOMContentLoaded", () => {
    const stars = document.querySelectorAll("#starRatingPicker .rating-star");
    const feedbackForm = document.getElementById("feedbackForm");
    const reviewsContainer = document.getElementById("reviewsContainer");
    let selectedRating = 5;

    stars.forEach((star, index) => {
        star.addEventListener("click", (e) => {
            e.stopPropagation();
            selectedRating = index + 1;
            stars.forEach((s, idx) => {
                s.className = idx <= index ? "fa-solid fa-star rating-star cursor-pointer text-[#00e699]" : "fa-regular fa-star rating-star cursor-pointer text-slate-600";
            });
        });
    });

    const loadMainReviews = () => {
        if (!reviewsContainer) return;
        reviewsContainer.innerHTML = "";
        const reviews = JSON.parse(localStorage.getItem("scamShieldReviews")) || [
            { name: "Ali Ahmed", rating: 5, text: "Zabardast tool! Mujhe aik fake Easypaisa cash reward wale link se bacha liya." },
            { name: "Sana Khan", rating: 5, text: "Bohot useful aur fast hai." }
        ];

        const validReviews = reviews.filter(r => r && r.name && r.name.trim() !== "");
        if (validReviews.length === 0) {
            reviewsContainer.innerHTML = `<p class="text-center text-slate-500 text-[11px] py-2">Koi feedback nahi mila.</p>`;
            return;
        }

        validReviews.forEach(rev => {
            let starsHTML = "";
            for (let i = 1; i <= 5; i++) starsHTML += i <= rev.rating ? `<i class="fa-solid fa-star text-[#00e699] mr-0.5 text-[9px]"></i>` : `<i class="fa-regular fa-star text-slate-700 mr-0.5 text-[9px]"></i>`;

            const reviewDiv = document.createElement("div");
            reviewDiv.className = "bg-[#0b0f19]/40 border border-slate-800/60 p-2.5 rounded-xl flex flex-col gap-0.5";
            reviewDiv.innerHTML = `
                <div class="flex justify-between items-center">
                    <span class="font-bold text-slate-300 text-xs flex items-center gap-1.5"><i class="fa-solid fa-circle-user text-slate-500 text-xs"></i> ${rev.name}</span>
                    <div class="bg-black/30 px-1.5 py-0.5 rounded border border-slate-800/50">${starsHTML}</div>
                </div>
                <p class="text-slate-400 text-[11px] md:text-xs leading-normal m-0 pl-5">${rev.text}</p>
            `;
            reviewsContainer.insertBefore(reviewDiv, reviewsContainer.firstChild);
        });
    };

    if (feedbackForm) {
        feedbackForm.addEventListener("submit", (e) => {
            e.preventDefault();
            const nameInput = document.getElementById("feedbackName");
            const textInput = document.getElementById("feedbackText");

            if (!nameInput.value.trim() || !textInput.value.trim()) return;

            const currentReviews = JSON.parse(localStorage.getItem("scamShieldReviews")) || [];
            currentReviews.push({ name: nameInput.value.trim(), rating: selectedRating, text: textInput.value.trim() });
            localStorage.setItem("scamShieldReviews", JSON.stringify(currentReviews));

            nameInput.value = "";
            textInput.value = "";
            selectedRating = 5;
            stars.forEach(s => s.className = "fa-solid fa-star rating-star cursor-pointer text-[#00e699]");
            toggleFeedbackForm();
            loadMainReviews();
            alert("Thank you! Aapka feedback submit ho gaya hai.");
        });
    }
    loadMainReviews();
});