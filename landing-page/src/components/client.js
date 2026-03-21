import React from "react";
import { Link } from "react-router-dom";
import mapImg from '../assets/images/svg-map.svg'

import TinySlider from "tiny-slider-react";
import 'tiny-slider/dist/tiny-slider.css';
import { clientData } from "../data/data";

import {FaBitcoin} from "../assets/icons/vander"

export default function Client(){
    let settings = {
        container: '.tiny-two-item',
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
                items: 2
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
        <section className="section" style={{backgroundImage:`url(${mapImg})`, backgroundPosition:'center', backgroundRepeat:'no-repeat'}}>
            <div className="container">
                <div className="row justify-content-center">
                    <div className="col-lg-10">
                        <div className="row">
                            <div className="col-12">
                                <div className="tiny-two-item">
                                <TinySlider settings={settings}>
                                    {clientData.map((item,index) =>{
                                        return(
                                            <div className="tiny-slide" key={index}>
                                                <div className="card border-0 customer-testi p-4 shadow rounded-md m-2 overflow-hidden bg-white">
                                                    <div className="d-flex align-items-center">
                                                        <img src={item.image} className="avatar avatar-small rounded-circle shadow" alt=""/>
                                                        <div className="flex-1 ms-3">
                                                            <div className="d-flex justify-content-between">
                                                                <span className="text-dark">{item.title} <Link to="#" className="text-primary h6">{item.name}</Link></span>
                                                                <small className="text-muted">{item.value}</small>
                                                            </div>
                                                            <div className="d-flex justify-content-between mt-3">
                                                                <span className="text-muted">{item.id}</span>
                                                                <span className="text-dark">{item.no}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="quote">
                                                        <FaBitcoin className="icon"/>
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </TinySlider>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}