import React from "react";

import TinySlider from "tiny-slider-react";
import 'tiny-slider/dist/tiny-slider.css';

import { successMap } from "../data/data";

export default function RoadMap(){
    let settings = {
        container: '.tiny-four-item',
        controls: false,
        mouseDrag: true,
        loop: true,
        rewind: true,
        autoplay: true,
        autoplayButtonOutput: false,
        autoplayTimeout: 3000,
        nav: false,
        speed: 400,
        gutter: 12,
        responsive: {
            992: {
                items: 4
            },

            767: {
                items: 2
            },

            320: {
                items: 1
            },
        },
      };
    return(
        <div className="row">
            <div className="col-12 mt-4 pt-2">
                <div className="tiny-four-item tiny-timeline">
                    <TinySlider settings={settings}>
                        {successMap.map((item,index) =>{
                            let Icon = item.icon
                            return(
                                <div className="tiny-slide text-center" key={index}>
                                    <div className={`${item.bg === true ? 'bg-primary p-4 feature-light' : ''} card pt-4 border-0 feature key-feature feature-primary item-box`}>
                                        <div className="icon text-center rounded-pill mx-auto mb-3 fs-5">
                                            <Icon/>
                                        </div>
                                        <p className={`${item.bg === true ? 'text-white-50': 'text-muted'} mb-0`}>{item.date}</p>
                                        <h6 className={`${item.bg === true ? 'text-light title-dark': 'text-dark'} mb-0 mt-1`}>{item.title}</h6>
                                    </div>
                                </div>
                            )
                        })}
                    </TinySlider>
                </div>
            </div>
        </div>
    )
}