(function($) {
	
	"use strict";
	
	
	//Hide Loading Box (Preloader)
	function handlePreloader() {
		if($('.preloader').length){
			$('body').addClass('page-loaded');
			$('.preloader').delay(0).fadeOut(0);
		}
	}
	
	
	//Update Header Style and Scroll to Top
	function headerStyle() {
		if($('.main-header-bar').length){
			var windowpos = $(window).scrollTop();
			var siteHeader = $('.main-header-bar');
			var scrollLink = $('.scroll-to-top');
			if (windowpos >= 60) {
				siteHeader.addClass('fixed-header');
				scrollLink.fadeIn(300);
			} else {
				siteHeader.removeClass('fixed-header');
				scrollLink.fadeOut(300);
			}
		}
	}
	
	headerStyle();
	
	//Open / Hide Main Menu
	if($('.main-header-bar .nav-toggler .toggler-btn').length){
		$('.main-header-bar .nav-toggler .toggler-btn').on('click', function(e) {
			e.preventDefault();
			$(this).addClass('active');
			$('.main-nav-outer').addClass('now-visible');
			$('body').addClass('navbar-visible');
		});
		//Hide
		$('.main-header-bar .nav-closer,.menu-backdrop').on('click', function(e) {
			e.preventDefault();
			$('.main-header-bar .nav-toggler .toggler-btn').removeClass('active');
			$('.main-nav-outer').removeClass('now-visible');
			$('body').removeClass('navbar-visible');
			$('.main-nav-box .navigation > li').removeClass('open');
			$('.main-nav-box .navigation li ul').slideUp(0);
		});
		$(document).keydown(function(e){
	        if(e.keyCode == 27) {
					$('body').removeClass('navbar-visible');
					$('.main-header-bar .nav-toggler .toggler-btn').removeClass('active');
					$('.main-nav-outer').removeClass('now-visible');
					$('.main-nav-box .navigation li ul').slideUp(0);
					$('.main-nav-box .navigation > li').removeClass('open');
	        }
	    });
	}
	
	//Main Menu Dropdown Toggle
	if($('.main-nav-box .navigation > li.dropdown > ul').length){
		//$('.main-header .navigation li.dropdown').append('<div class="dropdown-btn"><span class="fa fa-angle-down"></span></div>');
		
		//Show Submenu
		$('.main-nav-box .navigation > li.dropdown > a').on('click', function(e) {
			e.preventDefault();
			var target = $(this).parent('li').find('ul');
			
			if ($(target).is(':visible')){
				$(this).parent('li').removeClass('open');
				$(target).slideUp(500);
				$(this).parents('.navigation').find('li.dropdown').removeClass('open');
				$(this).parents('.navigation').find('li.dropdown > ul').slideUp(500);
				return false;
			}else{
				$(this).parents('.navigation').find('li.dropdown').removeClass('open');
				$(this).parents('.navigation').find('li.dropdown > ul').slideUp(500);
				$(this).parent('li').toggleClass('open');
				$(this).parent('li').find('ul').slideToggle(500);
			}
		});
		
		
	}

	//Navbar Custom Scroll
	if($('.main-nav-box').length){
		Scrollbar.initAll({
		  // Momentum reduction damping factor, a float value between (0, 1)
		  damping: .1,
		  // Minimal size for scrollbar thumb.
		  thumbMinSize: 20,
		  // Render scrolling by integer pixels
		  renderByPixels: true,
		  // Whether allow upper scrollable content to continue scrolling when current scrollbar reaches edge. 
		  // When set to 'auto', it will be enabled on nested scrollbars, and disabled on first-class scrollbars.
		  continuousScrolling: 'auto',
		  // Keep scrollbar tracks always visible.
		  alwaysShowTracks: false,
		  // Element to be used as a listener for mouse wheel scroll events. 
		  // By default, the container element is used.
		  wheelEventTarget: null,
		  // plugins
		  plugins: {}
		  
		});
	}

	//Horizontal Custom Scroll
	if($('.horizontal-scroll-box').length){
		$(".horizontal-scroll-box").mCustomScrollbar({
		    axis:"x",
		    setWidth:false,
		    autoHideScrollbar:false,
			 advanced:{autoExpandHorizontalScroll:true}
		});
	}

	//Banner Slider
	if ($('.banner-slider').length) {
		$('.banner-slider').owlCarousel({
			loop:true,
			animateOut: 'fadeOut',
    		animateIn: 'fadeIn',
			mouseDrag: false,
			touchDrag: false,
			margin:0,
			nav:true,
			smartSpeed: 700,
			autoplay: true,
			autoplayTimeout:7500,
			navText: [ '<span class="prev-btn far fa-angle-left"></span>', '<span class="next-btn far fa-angle-right"></span>' ],
			responsive:{
				0:{
					items:1
				},
				600:{
					items:1
				},
				800:{
					items:1
				},
				1200:{
					items:1
				}
			}
		});    		
	}

	//Banner Slider
	if ($('.banner-slider-two').length) {
		$('.banner-slider-two').owlCarousel({
			loop:true,
			margin:0,
			nav:true,
			smartSpeed: 700,
			autoplay: true,
			autoplayTimeout:7000,
			navText: [ '<span class="prev-btn fa fa-angle-left"></span>', '<span class="next-btn fa fa-angle-right"></span>' ],
			responsive:{
				0:{
					items:1
				},
				600:{
					items:1
				},
				768:{
					items:2
				},
				992:{
					items:2
				},
				1366:{
					items:3
				}
			}
		});    		
	}

	//Banner Carousel Three
	if ($('.banner-slider-three').length) {
		$('.banner-slider-three').bxSlider({
			pagerCustom: '.pager-one',
			auto:true,
			startSlide: 0,
			infiniteLoop: true,
			easing:'swing',
			adaptiveHeight: true,
			pause: 10000,
			slideMargin: 0,
			captions: true,
			nextText: '<span class="next-btn far fa-angle-right"></span>',
    		prevText: '<span class="prev-btn far fa-angle-left"></span>'
		});
	}

	//Banner Carousel Four
	if ($('.banner-slider-four').length) {
		$('.banner-slider-four').owlCarousel({
			loop:true,
			margin:80,
			nav:true,
			smartSpeed: 700,
			autoplay: true,
			autoplayTimeout:7000,
			navText: [ '<span class="prev-btn fa fa-angle-left"></span>', '<span class="next-btn fa fa-angle-right"></span>' ],
			responsive:{
				0:{
					items:1,
					margin: 30
				},
				600:{
					items:1,
					margin: 30
				},
				768:{
					items:2,
					margin: 30
				},
				992:{
					items:2,
					margin: 50
				},
				1200:{
					items:3,
					margin: 50
				},
				1600:{
					items:3,
					margin: 70
				},
				1920:{
					items:4,
					margin: 90
				}
			}
		});    		
	}

	//Banner Carousel Five
	if ($('.banner-slider-five').length) {
		$('.banner-slider-five').bxSlider({
			pagerCustom: '.pager-two',
			auto:true,
			startSlide: 0,
			infiniteLoop: true,
			easing:'swing',
			adaptiveHeight: true,
			pause: 10000,
			slideMargin: 0,
			captions: true,
			nextText: '<span class="next-btn far fa-angle-right"></span>',
    		prevText: '<span class="prev-btn far fa-angle-left"></span>'
		});
	}

	//Banner Carousel Six
	if ($('.banner-slider-six').length) {
		$('.banner-slider-six').bxSlider({
			pagerCustom: '.pager-three',
			auto:true,
			startSlide: 0,
			infiniteLoop: true,
			easing:'swing',
			adaptiveHeight: true,
			pause: 10000,
			slideMargin: 0,
			captions: true,
			nextText: '<span class="next-btn far fa-angle-right"></span>',
    		prevText: '<span class="prev-btn far fa-angle-left"></span>'
		});
	}

	//Banner Carousel Seven
	if ($('.banner-slider-seven').length) {
		$('.banner-slider-seven').bxSlider({
			pager: false,
			auto:true,
			startSlide: 0,
			infiniteLoop: true,
			easing:'fade',
			adaptiveHeight: true,
			pause: 10000,
			slideMargin: 0,
			captions: true,
			nextText: '<span class="next-btn far fa-long-arrow-right"></span>',
    		prevText: '<span class="prev-btn far fa-long-arrow-left"></span>'
		});
	}

	//Banner Carousel Eight
	if ($('.banner-slider-eight').length) {
		$('.banner-slider-eight').bxSlider({
			pager: false,
			auto:true,
			startSlide: 0,
			infiniteLoop: true,
			easing:'fade',
			adaptiveHeight: true,
			pause: 10000,
			slideMargin: 0,
			captions: true,
			nextText: '<span class="next-btn far fa-angle-left"></span>',
    		prevText: '<span class="prev-btn far fa-angle-right"></span>'
		});
	}

	//Banner Carousel Eight
	if ($('.banner-slider-nine').length) {
		$('.banner-slider-nine').bxSlider({
			pager: false,
			auto:true,
			startSlide: 0,
			infiniteLoop: true,
			easing:'fade',
			adaptiveHeight: true,
			pause: 10000,
			slideMargin: 0,
			captions: true,
			nextText: '<span class="next-btn far fa-angle-down"></span>',
    		prevText: '<span class="prev-btn far fa-angle-up"></span>'
		});
	}

	//MixitUp Gallery Filters
	 if($('.filter-list').length){
	 	 $('.filter-list').mixItUp({});
	 }

	//Accordion Box
	if($('.accordion-box').length){
		$(".accordion-box").on('click', '.acc-btn', function() {

			var outerBox = $(this).parents('.accordion-box');
			var target = $(this).parents('.accordion');

			if ($(this).next('.acc-content').is(':visible')){
				//return false;
				$(this).removeClass('active');
				$(this).next('.acc-content').slideUp(300);
				$(outerBox).children('.accordion').removeClass('active-block');
			}else{
				$(outerBox).find('.accordion .acc-btn').removeClass('active');
				$(this).addClass('active');
				$(outerBox).children('.accordion').removeClass('active-block');
				$(outerBox).find('.accordion').children('.acc-content').slideUp(300);
				$(this).next('.acc-content').slideDown(300);
				$(this).parent('.accordion').addClass('active-block');
			}
		});
	}

	//Tabs Box
	if($('.tabs-box').length){
		$('.tabs-box .tab-buttons .tab-btn').on('click', function(e) {
			e.preventDefault();
			var target = $($(this).attr('data-tab'));
			
			if ($(target).is(':visible')){
				return false;
			}else{
				target.parents('.tabs-box').find('.tab-buttons').find('.tab-btn').removeClass('active-btn');
				$(this).addClass('active-btn');
				target.parents('.tabs-box').find('.tabs-content').find('.tab').fadeOut(0);
				target.parents('.tabs-box').find('.tabs-content').find('.tab').removeClass('active-tab');
				$(target).fadeIn(300);
				$(target).addClass('active-tab');
			}
		});
	}

	//LightBox / Fancybox
	if($('.lightbox-image').length) {
		$('.lightbox-image').fancybox({
			openEffect  : 'fade',
			closeEffect : 'fade',
			helpers : {
				media : {}
			}
		});
	}
	

	// Scroll to a Specific Div
	if($('.scroll-to-target').length){
		$(".scroll-to-target").on('click', function() {
			var target = $(this).attr('data-target');
		   // animate
		   $('html, body').animate({
			   scrollTop: $(target).offset().top
			 }, 1500);
	
		});
	}
	
	// Elements Animation
	if($('.wow').length){
		var wow = new WOW(
		  {
			boxClass:     'wow',      // animated element css class (default is wow)
			animateClass: 'animated', // animation css class (default is animated)
			offset:       0,          // distance to the element when triggering the animation (default is 0)
			mobile:       false,       // trigger animations on mobile devices (default is true)
			live:         true       // act on asynchronously loaded content (default is true)
		  }
		);
		wow.init();
	}
	
	
/* ==========================================================================
   When document is Scrollig, do
   ========================================================================== */
	
	$(window).on('scroll', function() {
		headerStyle();
	});
	
/* ==========================================================================
   When document is loading, do
   ========================================================================== */
	
	$(window).on('load', function() {
		handlePreloader();
		if($('body.page-loaded').length){
			$('body').addClass('page-done');
		}
	});

/* ==========================================================================
   When document is Resized
   ========================================================================== */
	
	$(window).on('resize', function() {
		
	});
	
	

})(window.jQuery);