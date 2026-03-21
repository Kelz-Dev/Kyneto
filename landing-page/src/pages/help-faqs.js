import React, { useState } from "react";
import { Link } from "react-router-dom";

import bg1 from '../assets/images/bg/market.png'
import logoIcon from '../assets/images/icon-gradient.png'

import Navbar from "../components/navbar";
import LinkTabThree from "../components/linkTabThree";
import Footer from "../components/footer";

import { faqData } from "../data/data";

export default function HelpFaqs(){
    let [ activeTab, setActiveTab ] = useState(1);
    let [ activeIndex, setActiveIndex] = useState(1)
    return(
        <>
        <Navbar headClass="defaultscroll sticky" navClass="navigation-menu nav-right nav-light"/>

        <section className="bg-half-170 d-table w-100" style={{backgroundImage:`url(${bg1})`, backgroundPosition:'center'}}>
            <div className="bg-overlay bg-gradient-primary opacity-9"></div>
            <div className="container">
                <div className="row justify-content-center mt-5">
                    <div className="col-12">
                        <div className="section-title text-center">
                            <h4 className="title text-white title-dark fw-medium mb-4">Frequently Asked Questions</h4>
                            <p className="text-white-50 para-desc mx-auto mb-0">With Cryptor Trade, you can be sure your trading skills are matched with excellent service.</p>
                        </div>
                    </div>
                </div>
            </div> 
        </section>
        <LinkTabThree/>

        <section className="section">
            <div className="container">
                <div className="row">
                    <div className="col-lg-4 col-md-5 col-12">
                        <div className="card section-title bg-white p-4 shadow rounded border-0">
                            <ul className="nav nav-pills nav-justified flex-column bg-transparent mb-0">
                                <li className="nav-item">
                                    <Link to="#" className={`${activeTab === 1 ? 'active' : '' } nav-link rounded shadow`} onClick={() => setActiveTab(1)}>
                                        <div className="text-start py-1 px-3">
                                            <h6 className="mb-0">About Cryptor</h6>
                                        </div>
                                    </Link>
                                </li>
                                
                                <li className="nav-item mt-3">
                                    <Link to="#" className={`${activeTab === 2 ? 'active' : '' } nav-link rounded shadow`} onClick={() => setActiveTab(2)}>
                                        <div className="text-start py-1 px-3">
                                            <h6 className="mb-0">Accounts</h6>
                                        </div>
                                    </Link>
                                </li>
                                
                                <li className="nav-item mt-3">
                                    <Link to="#" className={`${activeTab === 3 ? 'active' : '' } nav-link rounded shadow`} onClick={() => setActiveTab(3)}>
                                        <div className="text-start py-1 px-3">
                                            <h6 className="mb-0">Transactions</h6>
                                        </div>
                                    </Link>
                                </li>

                                <li className="nav-item mt-3">
                                    <Link to="#" className={`${activeTab === 4 ? 'active' : '' } nav-link rounded shadow`} onClick={() => setActiveTab(4)}>
                                        <div className="text-start py-1 px-3">
                                            <h6 className="mb-0">Cryptocurrency Withdrawals</h6>
                                        </div>
                                    </Link>
                                </li>
                            </ul>
                        </div>
                    </div>

                    <div className="col-lg-8 col-md-7 col-12 mt-4 pt-2 mt-sm-0 pt-sm-0">
                        <div className="tab-content">
                            {activeTab === 1 ? 
                                <div className="tab-pane fade show active">
                                    <div className="section-title">
                                        <h5>About Cryptor</h5>
                                    </div>
            
                                    <div className="accordion mt-4 pt-2">
                                        {faqData.slice(0,4).map((item, index) =>{
                                            return(
                                                <div className="accordion-item rounded border-0 shadow mb-3" key={index}>
                                                    <h2 className="accordion-header">
                                                        <button className={`${activeIndex === item.id ? '' : 'collapsed'} accordion-button border-0 bg-white`} onClick={() =>setActiveIndex(item.id)}>
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
                                </div> : ''
                            }
                            {activeTab === 2 ? 
                                <div className="tab-pane fade show active">
                                    <div className="section-title">
                                        <h5>Accounts</h5>
                                    </div>
            
                                    <div className="accordion mt-4 pt-2">
                                        {faqData.slice(4,8).map((item, index) =>{
                                            return(
                                                <div className="accordion-item rounded border-0 shadow mb-3" key={index}>
                                                    <h2 className="accordion-header">
                                                        <button className={`${activeIndex === item.id ? '' : 'collapsed'} accordion-button border-0 bg-white`} onClick={() =>setActiveIndex(item.id)}>
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
                                </div> : ''
                            }
                            {activeTab === 3 ? 
                                <div className="tab-pane fade show active">
                                    <div className="section-title">
                                        <h5>Transactions</h5>
                                    </div>
            
                                    <div className="accordion mt-4 pt-2">
                                        {faqData.slice(8,12).map((item, index) =>{
                                            return(
                                                <div className="accordion-item rounded border-0 shadow mb-3" key={index}>
                                                    <h2 className="accordion-header">
                                                        <button className={`${activeIndex === item.id ? '' : 'collapsed'} accordion-button border-0 bg-white`} onClick={() =>setActiveIndex(item.id)}>
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
                                </div> : ''
                            }
                            {activeTab === 4 ?
                                <div className="tab-pane fade show active">
                                    <div className="section-title" id="support">
                                        <h5>Cryptocurrency Withdrawals</h5>
                                    </div>
            
                                    <div className="accordion mt-4 pt-2" id="supportquestion">
                                        {faqData.slice(12,16).map((item, index) =>{
                                            return(
                                                <div className="accordion-item rounded border-0 shadow mb-3" key={index}>
                                                    <h2 className="accordion-header">
                                                        <button className={`${activeIndex === item.id ? '' : 'collapsed'} accordion-button border-0 bg-white`} onClick={() =>setActiveIndex(item.id)}>
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
                                </div> : ''
                            }
                        </div>
                    </div>
                </div>
            </div>
            
            <div className="position-absolute top-50 end-0 translate-middle-y" style={{zIndex: '-1', opacity: '0.1'}}>
                <img src={logoIcon} height="550" alt=""/>
            </div>
        </section>

        <section className="section bg-light">
            <div className="container">
                <div className="row justify-content-center">
                    <div className="col-12">
                        <div className="section-title text-center">
                            <h4 className="title mb-4">Be the first to know about Crypto news everyday</h4>
                            <p className="para-desc mx-auto text-muted mb-0">Get crypto analysis, news and updates right to your inbox! Sign up here so you don't miss a single newsletter.</p>
                        
                            <div className="subcribe-form mt-5">
                                <form>
                                    <div className="mb-0">
                                        <input type="email" id="email" name="email" className="bg-white rounded" required placeholder="Enter your email address"/>
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