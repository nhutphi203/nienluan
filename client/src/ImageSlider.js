import React from "react";
import Slider from "react-slick";

const ImageSlider = () => {
    const settings = {
        dots: true,
        infinite: true,
        speed: 500,
        slidesToShow: 1,
        slidesToScroll: 1,
        autoplay: true,
        autoplaySpeed: 3000,
        arrows: true,
    };

    const images = [
        "https://cdn.pixabay.com/photo/2016/11/21/17/27/classroom-1843476_1280.jpg",
        "https://cdn.pixabay.com/photo/2015/07/17/22/42/student-849825_1280.jpg",
        "https://cdn.pixabay.com/photo/2015/09/05/21/51/library-925643_1280.jpg"
    ];


    return (
        <div style={{ width: "80%", margin: "auto", paddingTop: "20px" }}>
            <Slider {...settings}>
                {images.map((img, index) => (
                    <div key={index}>
                        <img src={img} alt={`Slide ${index + 1}`} />
                    </div>
                ))}
            </Slider>
        </div>
    );
};

export default ImageSlider;
