import React from 'react';
import Slider from 'react-slick';
import './PhotoSlider.css'; // Import the new CSS

// Import the base slick carousel styles
import "slick-carousel/slick/slick.css"; 
import "slick-carousel/slick/slick-theme.css";

const PhotoSlider = ({ photos }) => {
  // Settings for the carousel
  const settings = {
    dots: true,
    infinite: photos.length > 1, // Only be infinite if there's more than one photo
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    adaptiveHeight: false, // Use fixed height from CSS
    arrows: false, // Hide the side arrows for a cleaner look
  };

  if (!photos || photos.length === 0) {
    return null;
  }

  // We need to use the full Cloudflare URL for the images
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  const getFullImageUrl = (url) => {
    if (!url) return '';
    return url.startsWith('http') ? url : `${API_BASE_URL}${url}`;
  };

  return (
    <div className="photo-slider-container">
      <Slider {...settings}>
        {photos.map((photoUrl, index) => (
          <div key={index}>
            {/* Image tag is now cleaner, styled by the CSS file */}
            <img src={getFullImageUrl(photoUrl)} alt={`Report photo ${index + 1}`} />
          </div>
        ))}
      </Slider>
    </div>
  );
};

export default PhotoSlider;