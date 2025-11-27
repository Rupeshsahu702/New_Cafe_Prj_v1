import React from "react";
import "./Slideshow.css";
import { SLIDESHOW_IMAGES } from "../../assets/slideshow";

/**
 * Pure-CSS infinite scrolling slideshow row.
 * We render the images twice in a row so the animation loops seamlessly.
 * Height is fixed visually; mixed image sizes are normalized with object-fit.
 */
const Slideshow = () => {
  // duplicate list to create an endless track
  const track = [...SLIDESHOW_IMAGES, ...SLIDESHOW_IMAGES];

  return (
    <section className="ss-wrapper">
      <div className="ss-heading">
        {/* optional small heading; delete if you hate joy */}
        <h2>What’s cooking</h2>
        <p>Fresh picks rolling by. It loops forever. Just like your cravings.</p>
      </div>

      <div className="ss-viewport">
        <ul className="ss-track">
          {track.map((src, i) => (
            <li className="ss-slide" key={i}>
              <img src={src} alt="" loading="lazy" />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
};

export default Slideshow;
