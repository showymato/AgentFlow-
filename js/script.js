//tabs on pricing page
document.addEventListener('DOMContentLoaded', function () {
    let items = document.querySelectorAll('.buy .tab-1, .buy .tab-2');

    items.forEach((el) => {
        initEventClick(el);
    });

    document.head.insertAdjacentHTML("beforeend", `<style>.tab-active{pointer-events:none;cursor:pointer;}</style>`);

}, false);



function initEventClick(el, trigger, animationData) {

    //add click and touch events
    ['click', 'touchstart'].forEach(function (eventType) {
        el.addEventListener(eventType, function (e) {
            let activeEl = document.querySelector('.tab-active');
            if (activeEl) document.querySelector('.tab-active').classList.remove('tab-active');
            el.classList.add('tab-active');

            //wait for the animation to finish, before allowing another click
            el.parentNode.style.pointerEvents = 'none';
            setTimeout(() => {
                el.parentNode.style.pointerEvents = '';
            }, 1000);

        }, { passive: true });
    });
}