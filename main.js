document.addEventListener("DOMContentLoaded", () => {
    // 1. Popup Logic
    const popup = document.getElementById('popupForm');
    const closeBtn = document.getElementById('popupClose');

    function showPopup() {
        if(popup) {
            popup.classList.add('show');
            popup.style.visibility = 'visible';
            popup.style.opacity = '1';
        }
    }
    function hidePopup() {
        if(popup) {
            popup.classList.remove('show');
            popup.style.visibility = 'hidden';
            popup.style.opacity = '0';
            localStorage.setItem('popupShown', 'true');
        }
    }

    if (closeBtn) closeBtn.addEventListener('click', hidePopup);
    
    if (popup) {
        popup.addEventListener('click', (e) => {
            if (e.target === popup) hidePopup();
        });
    }

    if (!localStorage.getItem('popupShown')) {
        setTimeout(showPopup, 8000);
    }

    // 2. Stagger Reveal Animation
    const selectors = ['.about-card', '.process-box', '.case-box', '.pillar'];
    selectors.forEach(selector => {
        const nodes = document.querySelectorAll(selector);
        nodes.forEach((node, i) => {
            node.style.opacity = '0';
            node.style.transform = 'translateY(20px)';
            setTimeout(() => {
                node.style.transition = 'all 0.6s cubic-bezier(0.2, 0.8, 0.2, 1)';
                node.style.opacity = '1';
                node.style.transform = 'translateY(0)';
            }, 150 + (i * 100));
        });
    });

    // 3. Simple Testimonial Slider (Auto-scroll fix)
    const track = document.querySelector('.testimonial-track');
    const cards = document.querySelectorAll('.testimonial-card');
    
    if (track && cards.length > 0) {
        let index = 0;
        
        // Quick layout fix for flex track
        track.style.display = 'flex';
        track.style.transition = 'transform 0.5s ease-in-out';
        track.style.gap = '20px';

        function moveSlider() {
            index++;
            if (index >= cards.length) {
                index = 0; 
            }
            const cardWidth = cards[0].offsetWidth + 20; // width + gap
            track.style.transform = `translateX(-${index * cardWidth}px)`;
        }
        
        setInterval(moveSlider, 4000);
    }
});
