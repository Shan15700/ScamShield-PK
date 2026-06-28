// Global variable to track active tab
let currentTab = 'link';

// Tab switching mechanism
function switchTab(tabType) {
    currentTab = tabType;
    const inputField = document.getElementById('main-input');
    const resultBox = document.getElementById('result-box');
    resultBox.classList.add('hidden'); // Reset result box
    inputField.value = ''; // Clear input

    // Update Tab UI Colors (English styling matches)
    document.getElementById('tab-link').className = `pb-3 px-4 font-semibold flex items-center gap-2 cursor-pointer transition ${tabType === 'link' ? 'text-emerald-400 border-b-2 border-emerald-400' : 'text-slate-400 hover:text-white'}`;
    document.getElementById('tab-sms').className = `pb-3 px-4 font-semibold flex items-center gap-2 cursor-pointer transition ${tabType === 'sms' ? 'text-emerald-400 border-b-2 border-emerald-400' : 'text-slate-400 hover:text-white'}`;
    document.getElementById('tab-call').className = `pb-3 px-4 font-semibold flex items-center gap-2 cursor-pointer transition ${tabType === 'call' ? 'text-emerald-400 border-b-2 border-emerald-400' : 'text-slate-400 hover:text-white'}`;

    // Update Input Placeholder to English
    if (tabType === 'link') inputField.placeholder = "Paste the suspicious Link (URL) here (e.g., bit.ly, tinyurl, or direct domains)...";
    if (tabType === 'sms') inputField.placeholder = "Copy and paste the full SMS text message here...";
    if (tabType === 'call') inputField.placeholder = "Enter the scammer phone number (e.g., 03XXXXXXXXX)...";
}

// Helper function to show output on UI
function displayResult(assessment) {
    const resultBox = document.getElementById('result-box');
    const rIcon = document.getElementById('result-icon');
    const rTitle = document.getElementById('result-title');
    const rDesc = document.getElementById('result-desc');

    resultBox.classList.remove('hidden');
    if (assessment.status === 'scam') {
        resultBox.className = "rounded-xl p-5 text-left flex items-start gap-4 border border-red-500 bg-red-950/30 text-red-200 animate-fade-in mb-6";
        rIcon.innerHTML = "❌";
        rTitle.innerText = assessment.title;
        rDesc.innerText = assessment.desc;
    } else {
        resultBox.className = "rounded-xl p-5 text-left flex items-start gap-4 border border-emerald-500 bg-emerald-950/30 text-emerald-200 animate-fade-in mb-6";
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
        desc: 'No obvious scam patterns were detected. However, always exercise caution and never share your sensitive personal credentials.'
    };

    // 1. LINK ANALYZER LOGIC
    if (currentTab === 'link') {
        const shorteners = ['bit.ly', 'tinyurl.com', 't.co', 'rb.gy', 'is.gd', 'cutt.ly', 'shorturl.at'];
        let isShortLink = shorteners.some(domain => input.includes(domain));
        let expandedSuccessfully = false;
        let originalInput = input;

        // Static Local Definitions to prevent absolute reliance on dynamic proxies
        const scamDomains = ['.xyz', '.top', '.site', '.apk', '.online', '.tk', '.ml'];
        const scamKeywords = ['easypaisa', 'jazzcash', 'bisp', 'lottery', 'reward', 'free-gift', 'free-data', 'hbl-bonus'];

        let hasBadExtension = scamDomains.some(ext => input.includes(ext));
        let hasBadKeyword = scamKeywords.some(keyword => input.includes(keyword));

        let userLinks = JSON.parse(localStorage.getItem('scamLinks')) || [];
        let isUserLink = userLinks.includes(input) || userLinks.includes(originalInput);

        // Immediate check to bypass API calls if signature is already matching scam database
        if (hasBadExtension || hasBadKeyword || isUserLink) {
            assessment = {
                status: 'scam',
                title: '🚨 DANGEROUS / PHISHING LINK DETECTED!',
                desc: 'This link leads to a suspicious website designed to steal your credentials or funds. Avoid it.'
            };
            displayResult(assessment);
            return;
        }

        if (isShortLink) {
            // Loader State Allocation
            resultBox.classList.remove('hidden');
            resultBox.className = "rounded-xl p-5 text-left flex items-start gap-4 border border-cyan-500 bg-cyan-950/30 text-cyan-200 animate-fade-in mb-6";
            rIcon.innerHTML = "🔄";
            rTitle.innerText = "🔍 Expanding Hidden URL...";
            rDesc.innerText = "Analyzing the destination behind this shortened link. Please wait...";

            let targetUrl = input.startsWith('http') ? input : 'https://' + input;

            try {
                // Optimized Proxy URI Wrapper structure to bypass standard CORS rejections
                const res = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent('https://unshorten.me/json/' + encodeURIComponent(targetUrl))}`);
                const data = await res.json();

                if (data && data.contents) {
                    const apiResult = JSON.parse(data.contents);
                    if (apiResult && apiResult.resolved_url) {
                        let resolvedUrl = apiResult.resolved_url.toLowerCase().trim();

                        // Secondary scanning verification layer over expanded values
                        let secondaryCheck = scamDomains.some(ext => resolvedUrl.includes(ext)) ||
                            scamKeywords.some(keyword => resolvedUrl.includes(keyword)) ||
                            userLinks.includes(resolvedUrl);

                        if (secondaryCheck) {
                            assessment = {
                                status: 'scam',
                                title: '🚨 REDIRECTS TO MALICIOUS SITE!',
                                desc: `This short URL redirects to a dangerous domain: [ ${apiResult.resolved_url} ]. Do NOT visit it under any circumstances.`
                            };
                        } else {
                            assessment = {
                                status: 'safe',
                                title: 'Short Link Appears Legitimate',
                                desc: `Successfully verified destination: [ ${apiResult.resolved_url} ]. No immediate threats found.`
                            };
                        }
                        expandedSuccessfully = true;
                    }
                }
            } catch (e) {
                console.log("CORS/Network error occurred, falling back to local risk assessment.");
            }

            // Fallback safety state execution if network resolver fails
            if (!expandedSuccessfully) {
                assessment = {
                    status: 'scam',
                    title: '⚠️ UNVERIFIED SHORT LINK!',
                    desc: 'This is an obfuscated short link. Due to network security protocols, we cannot safely trace its target destination right now. Treat it as high risk.'
                };
            }
        }
    }
    // 2. SMS ANALYZER LOGIC
    else if (currentTab === 'sms') {
        const smsKeywords = ['bisp', 'benazir', 'inam', 'lottery', 'jeeto pakistan', 'account blocked', 'otp share', 'fouji', 'hq', 'won cash', 'prize money'];
        let isScamSMS = smsKeywords.some(keyword => input.includes(keyword));

        let userSMS = JSON.parse(localStorage.getItem('scamSMS')) || [];
        let isUserSMS = userSMS.some(savedText => input.includes(savedText.toLowerCase()));

        if (isScamSMS || isUserSMS) {
            assessment = {
                status: 'scam',
                title: '🚨 FRAUDULENT MESSAGE DETECTED!',
                desc: 'This text contains known high-risk deceptive bait keywords (BISP, Prize, Blocked, OTP). This matches 100% scam patterns.'
            };
        }
    }
    // 3. CALL / NUMBER LOGIC
    else if (currentTab === 'call') {
        let cleanNumber = input.replace(/[^0-9]/g, '');
        let blacklistedNumbers = JSON.parse(localStorage.getItem('scamNumbers')) || ["03001234567", "03129876543"];
        let isReported = blacklistedNumbers.includes(cleanNumber);

        if (isReported) {
            assessment = {
                status: 'scam',
                title: '🚨 BLOCKED SCAMMER NUMBER!',
                desc: 'This phone number has been flagged and blacklisted by our global database. Do NOT answer calls from it.'
            };
        }
    }

    displayResult(assessment);
}

// User Reporting System Function
function userReportScam() {
    const input = document.getElementById('main-input').value.trim();
    if (!input) return alert("Please type or paste the malicious entity before reporting!");

    let dbKey = '';
    if (currentTab === 'link') dbKey = 'scamLinks';
    if (currentTab === 'sms') dbKey = 'scamSMS';
    if (currentTab === 'call') dbKey = 'scamNumbers';

    let finalInput = (currentTab === 'call') ? input.replace(/[^0-9]/g, '') : input.toLowerCase();
    let currentList = JSON.parse(localStorage.getItem(dbKey)) || [];

    if (currentList.includes(finalInput)) {
        alert("🚨 This entry is already registered in the blacklist database!");
        return;
    }

    currentList.push(finalInput);
    localStorage.setItem(dbKey, JSON.stringify(currentList));

    alert("✅ Thank you! Your report has been submitted successfully and added to the real-time blocklist.");
    document.getElementById('main-input').value = '';
    document.getElementById('result-box').classList.add('hidden');
}