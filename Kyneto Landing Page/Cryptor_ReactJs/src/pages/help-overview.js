import React, { useState } from "react";
import {Link} from 'react-router-dom'

import bg1 from '../assets/images/bg/market.png'
import Navbar from "../components/navbar";
import LinkTabThree from "../components/linkTabThree";
import { accordionData, overviewData } from "../data/data";
import Footer from "../components/footer";

export default function HelpOverview(){
    let [ activeIndex, setActiveIndex ] = useState(1)
    return(
        <>
        <Navbar headClass="defaultscroll sticky" navClass="navigation-menu nav-right nav-light"/>
        <section className="bg-half-170 d-table w-100" style={{backgroundImage:`url(${bg1})`, backgroundPosition:'bottom'}}>
            <div className="bg-overlay bg-gradient-primary opacity-9"></div>
            <div className="container">
                <div className="row justify-content-center mt-5">
                    <div className="col-12">
                        <div className="section-title text-center">
                            <h4 className="title text-white title-dark fw-medium mb-4">Overview</h4>
                            <p className="text-muted para-desc mx-auto mb-0">With Kyneto Trade, you can be sure your trading skills are matched with excellent service.</p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
        <LinkTabThree/>
        <section className="section">
            <div className="container">
                <div className="row justify-content-center">
                    <div className="col-12">
                        <div className="section-title text-center mb-4 pb-2">
                            <h4 className="title mb-3">The most trusted cryptocurrency platform</h4>
                            <p className="text-muted para-desc mx-auto mb-0">Use your credit card, payment app, or bank account to buy Bitcoin, Bitcoin Cash, Ethereum, and other select cryptocurrencies</p>
                        </div>
                    </div>
                </div>

                <div className="row justify-content-center">
                    {overviewData.map((item,index) =>{
                        let Icon = item.icon
                        return(
                            <div className="col-lg-4 col-md-6 mt-4 pt-2" key={index}>
                                <div className="feature feature-primary feature-clean text-center rounded p-4">
                                    <div className="icons text-center">
                                        <Icon className="icon d-block mx-auto rounded h3 mb-0"/>
                                    </div>
                                    <div className="content mt-4">
                                        <Link to={item.link} className="text-dark h5 title">{item.title}</Link>
                                        <p className="text-muted mt-3 mb-0">{item.desc}</p>
                                        <div className="mt-2">
                                            <Link to={item.link} className="link">Read More</Link>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
            <div className="container mt-100 mt-60">
                <div className="row justify-content-center">
                    <div className="col-12">
                        <div className="section-title text-center mb-4 pb-2">
                            <h4 className="mb-4">Get Started</h4>
                            <p className="para-desc mx-auto text-muted">Use your credit card, payment app, or bank account to buy Bitcoin, Bitcoin Cash, Ethereum, and other select cryptocurrencies</p>
                        </div>
                    </div>
                </div>

                <div className="row justify-content-center">
                    <div className="col-lg-8 col-md-7 col-12 mt-4 pt-2 mt-sm-0 pt-sm-0">
                        <div className="tab-content">
                            <div className="tab-pane fade show active">
                                <div className="accordion mt-4 pt-2">
                                    {accordionData.map((item, index) =>{
                                        return(
                                            <div className="accordion-item rounded border-0 shadow mb-3" key={index}>
                                                <h2 className="accordion-header">
                                                    <button className={`${activeIndex === item.id ? '' :'collapsed'} accordion-button border-0 bg-white`} type="button" onClick={() =>setActiveIndex(item.id)}>
                                                        {item.title}
                                                    </button>
                                                </h2>
                                                <div className={`${activeIndex === item.id ? 'show' : '' } accordion-collapse border-0 collapse`}>
                                                    <div className="accordion-body text-muted bg-white">
                                                        {item.desc}
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
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