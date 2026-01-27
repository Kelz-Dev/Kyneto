import React from "react";

import bg1 from '../assets/images/bg/market.png'

import Navbar from "../components/navbar";
import RoadMap from "../components/roadMap";
import Footer from "../components/footer";

export default function RoadMaps(){
    return(
        <>
        <Navbar headClass="defaultscroll sticky" navClass="navigation-menu nav-right nav-light"/>
        <section className="bg-half-170 d-table w-100" style={{backgroundImage:`url(${bg1})`, backgroundPosition:'bottom'}}>
            <div className="bg-overlay bg-gradient-primary opacity-9"></div>
            <div className="container">
                <div className="row justify-content-center mt-5">
                    <div className="col-12">
                        <div className="section-title text-center">
                            <h4 className="title text-white title-dark fw-medium mb-4">Roadmap: Cryptor</h4>
                            <p className="text-white-50 para-desc mx-auto mb-0">With Cryptor Trade, you can be sure your trading skills are matched with excellent service.</p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
        <section className="section" id="roadmap">
            <div className="container">
                <RoadMap/>
            </div>
            
            <div className="container mt-100 mt-60">
                <div className="row justify-content-center">
                    <div className="col-12">
                        <div className="section-title text-center">
                            <h4 className="title mb-4">Be the first to know about Crypto news everyday</h4>
                            <p className="para-desc mx-auto text-muted mb-0">Get crypto analysis, news and updates right to your inbox! Sign up here so you don't miss a single newsletter.</p>
                        
                            <div className="subcribe-form mt-5">
                                <form>
                                    <div className="mb-0">
                                        <input type="email" id="email" name="email" className="bg-light rounded" required placeholder="Enter your email address"/>
                                        <button type="submit" className="btn btn-primary">Notify me</button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
        <Footer/>
        </>
    )
}