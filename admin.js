document.addEventListener("DOMContentLoaded", () => {
    // 1. Dashboard ke stats load karne ka logic
    const loadDashboardStats = () => {
        const linksList = JSON.parse(localStorage.getItem('scamLinks')) || [];
        const smsList = JSON.parse(localStorage.getItem('scamSMS')) || [];
        const callsList = JSON.parse(localStorage.getItem('scamNumbers')) || ["03001234567", "03129876543"];

        document.getElementById('stat-links').innerText = linksList.length;
        document.getElementById('stat-sms').innerText = smsList.length;
        document.getElementById('stat-calls').innerText = callsList.length;
    };

    // 2. Reviews ko admin table mein render karne ka logic
    const renderAdminReviews = () => {
        const tableBody = document.getElementById("adminReviewsBody");
        const countBadge = document.getElementById("review-count-badge");
        if (!tableBody) return;

        tableBody.innerHTML = "";

        // Default mock reviews agar localStorage khali ho
        const reviews = JSON.parse(localStorage.getItem("scamShieldReviews")) || [
            { name: "Ali Ahmed", rating: 5, text: "Zabardast tool! Mujhe aik fake Easypaisa cash reward wale link se bacha liya." },
            { name: "Sana Khan", rating: 5, text: "Bohot useful aur fast hai. Maine apne ghar ke tamam devices par bookmark karwa diya hai." }
        ];

        // Khali names filter karne ka strict check (image_240642.png ka fix)
        const strictValidReviews = reviews.filter(r => r && r.name && r.name.trim() !== "");
        countBadge.innerText = strictValidReviews.length;

        if (strictValidReviews.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="4" class="py-6 text-center text-slate-500 italic text-[11px]">
                        Koi public feedback entry maujood nahi hai.
                    </td>
                </tr>`;
            return;
        }

        // Latest reviews ko top par lane ke liye loop
        strictValidReviews.forEach((rev, originalIndex) => {
            let starsHTML = "";
            for (let i = 1; i <= 5; i++) {
                if (i <= rev.rating) {
                    starsHTML += `<i class="fa-solid fa-star text-amber-400 mr-0.5 text-[10px]"></i>`;
                } else {
                    starsHTML += `<i class="fa-regular fa-star text-slate-700 mr-0.5 text-[10px]"></i>`;
                }
            }

            const tr = document.createElement("tr");
            tr.className = "hover:bg-slate-800/20 transition-colors";
            tr.innerHTML = `
                <td class="py-3 px-4 font-bold text-slate-200 flex items-center gap-1.5 whitespace-nowrap">
                    <i class="fa-solid fa-circle-user text-slate-600 text-sm"></i> ${rev.name}
                </td>
                <td class="py-3 px-4 whitespace-nowrap">${starsHTML}</td>
                <td class="py-3 px-4 text-slate-400 break-words max-w-xs md:max-w-none text-[11px] md:text-xs">${rev.text}</td>
                <td class="py-3 px-4 text-center whitespace-nowrap">
                    <button class="bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white border border-red-500/20 px-2.5 py-1 rounded-lg text-[10px] font-bold transition active:scale-95 cursor-pointer flex items-center gap-1 mx-auto delete-btn" data-index="${originalIndex}">
                        <i class="fa-solid fa-trash text-[9px]"></i> Delete
                    </button>
                </td>
            `;
            tableBody.insertBefore(tr, tableBody.firstChild);
        });

        // Delete buttons par click listener lagana
        document.querySelectorAll(".delete-btn").forEach(btn => {
            btn.addEventListener("click", function (e) {
                const targetIndex = parseInt(this.getAttribute("data-index"));
                deleteReviewItem(targetIndex);
            });
        });
    };

    // 3. Review delete karne ka global function
    window.deleteReviewItem = (index) => {
        if (!confirm("Kya aap waqai is feedback review ko system se delete karna chahte hain?")) return;

        const reviews = JSON.parse(localStorage.getItem("scamShieldReviews")) || [
            { name: "Ali Ahmed", rating: 5, text: "Zabardast tool! Mujhe aik fake Easypaisa cash reward wale link se bacha liya." },
            { name: "Sana Khan", rating: 5, text: "Bohot useful aur fast hai. Maine apne ghar ke tamam devices par bookmark karwa diya hai." }
        ];

        const strictValidReviews = reviews.filter(r => r && r.name && r.name.trim() !== "");

        // Array se item remove karna
        strictValidReviews.splice(index, 1);
        localStorage.setItem("scamShieldReviews", JSON.stringify(strictValidReviews));

        // UI ko refresh karna
        renderAdminReviews();
    };

    // Initialize scripts
    loadDashboardStats();
    renderAdminReviews();
});