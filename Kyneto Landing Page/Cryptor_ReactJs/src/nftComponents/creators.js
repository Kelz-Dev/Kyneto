import React from "react";
import { Link } from "react-router-dom";

import { creatorData } from "../data/nftdata";

import {FiArrowRightCircle} from "../assets/icons/vander"


import TinySlider from "tiny-slider-react";
import 'tiny-slider/dist/tiny-slider.css';

export default function Creators(){

    let settings = {
        container: '.tiny-five-item',
        controls: false,
        mouseDrag: true,
        loop: true,
        rewind: true,
        autoplay: true,
        autoplayButtonOutput: false,
        autoplayTimeout: 3000,
        navPosition: "bottom",
        speed: 400,
        gutter: 12,
        responsive: {
            992: {
                items: 5
            },

            767: {
                items: 3
            },

            320: {
                items: 1
            },
        },
      };
    return(
        <div className="row">
            <div className="col-12 mt-4 pt-2">
                <div className="tiny-five-item">
                    <TinySlider settings={settings}>
                        {creatorData.map((item,index) =>{
                            return(
                                <div className="tiny-slide" key={index}>
                                    <div className={`${item.badge} card nft-creator border-0 rounded-md shadow m-2`}>
                                        <div className="card-body p-3">
                                            <div className="pb-3 border-bottom">
                                                <div className="d-flex justify-content-between align-items-center">
                                                    <span className="badge bg-soft rounded-pill">No. #{item.id}</span>
            
                                                    <Link to="/nft-collection" className="text-dark h5 mb-0 read-more"><FiArrowRightCircle /></Link>
                                                </div>
                                            </div>
                                            <div className="content mt-3">
                                                <div className="position-relative text-center">
                                                    <img src={item.client} className="avatar avatar-small rounded-pill shadow" alt=""/>
                                                    
                                                    <div className="author mt-2">
                                                        <Link to={`/nft-creator-profile/${item.id}`} className="text-dark h6 name">{item.name}</Link>
                                                        <small className="d-block fw-medium mt-1 text-dark">0.75<span className="text-muted">ETH</span></small>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
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