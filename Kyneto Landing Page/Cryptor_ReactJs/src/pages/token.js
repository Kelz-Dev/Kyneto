import React, { useState, useEffect } from 'react';
import { Link } from "react-router-dom";

import logoIcon from '../assets/images/icon-gradient.png'

import Navbar from "../components/navbar";
import RoadMap from '../components/roadMap';
import Footer from '../components/footer';


import ModalVideo from 'react-modal-video';
import CountUp from 'react-countup';

import { FiArrowRightCircle, FiVideo } from '../assets/icons/vander'
import { counterData, tokenAbout } from '../data/data';

export default function Token() {
    let [isOpen, setOpen] = useState(false);
    let [days, setDays] = useState(0);
    let [hours, setHours] = useState(0);
    let [minutes, setMinutes] = useState(0);
    let [seconds, setSeconds] = useState(0);

    let deadline = "December, 31, 2024";

    let getTime = () => {
        let time = Date.parse(deadline) - Date.now();
        setDays(Math.floor(time / (1000 * 60 * 60 * 24)));
        setHours(Math.floor((time / (1000 * 60 * 60)) % 24));
        setMinutes(Math.floor((time / 1000 / 60) % 60));
        setSeconds(Math.floor((time / 1000) % 60));
    };

    useEffect(() => {
        let interval = setInterval(() => getTime(deadline), 1000);
        return () => clearInterval(interval);
    })

    return (
        <>
            <Navbar headClass="defaultscroll sticky" navClass="navigation-menu nav-right nav-light" />
            <section className="bg-half-170 d-flex align-items-center">
                <div className="bg-overlay bg-gradient-primary"></div>
                <div className="container">
                    <div className="row mt-4 align-items-center">
                        <div className="col-lg-6 offset-lg-1 col-md-6 col-12 order-1 order-md-2">
                            <div className="title-heading">
                                <span className="badge bg-soft-success rounded-md">Sale tokens</span>
                                <h4 className="display-5 fw-medium text-white title-dark mt-3 mb-4">The token sale is live!</h4>
                                <p className="text-white-50 para-desc mx-auto mb-0">With Kyneto Trade, you can be sure your trading skills are matched with excellent service.</p>
                                <div className="mt-4">
                                    <Link to="#" onClick={() => setOpen(true)} className="btn btn-icon btn-pills btn-primary m-1 lightbox"><FiVideo className="icons" /></Link><small className="fw-medium text-light title-dark align-middle ms-1">Watch Now</small>
                                </div>
                                <ModalVideo
                                    channel="youtube"
                                    youtube={{ mute: 0, autoplay: 0 }}
                                    isOpen={isOpen}
                                    videoId="yba7hPeTSjk"
                                    onClose={() => setOpen(false)}
                                />
                            </div>
                        </div>

                        <div className="col-lg-5 col-md-6 col-12 mt-4 pt-2 mt-sm-0 pt-sm-0 order-2 order-md-1">
                            <div className="card border-0 shadow rounded p-4 bg-light overflow-hidden">
                                <img src={logoIcon} className="avatar avatar-md-md d-block mx-auto" alt="" />
                                <h5 className="text-center text-dark mt-3">Kyneto Token Sale</h5>
                                <div className="row">
                                    <div className="col-md-12 text-center">
                                        <div id="token-sale">
                                            <ul className="count-down list-unstyled m-0">
                                                <li id="days" className="count-number fw-medium mb-0 list-inline-item px-3">{days}<p className='count-head'>Days</p></li>
                                                <li id="hours" className="count-number fw-medium mb-0 list-inline-item px-3">{hours}<p className='count-head'>Hours</p></li>
                                                <li id="mins" className="count-number fw-medium mb-0 list-inline-item px-3">{minutes}<p className='count-head'>Mins</p></li>
                                                <li id="secs" className="count-number fw-medium mb-0 list-inline-item px-3">{seconds}<p className='count-head'>Secs</p></li>
                                                <li id="end" className="h1"></li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>

                                <p className="text-muted text-center">Token sale ends <span className="text-dark fw-medium">December 31st 2024</span></p>

                                <div className="progress-box mt-4">
                                    <div className="progress rounded-md" style={{ height: "16px" }}>
                                        <div className="progress-bar position-relative bg-gradient-primary rounded-md" style={{ width: "60%" }}>
                                            <div className="progress-value d-block text-muted h6">Funded 60% = $ 600000</div>
                                        </div>
                                    </div>
                                    <div className="d-flex justify-content-between mt-2">
                                        <h6 className="title text-muted text-start mb-0">$ 1000</h6>
                                        <h6 className="title text-muted text-end mb-0">$ 1000000</h6>
                                    </div>
                                </div>

                                <ul className="list-unstyled mb-0 mt-4">
                                    <li className="h6 my-2 ms-0"><FiArrowRightCircle className="text-primary align-middle fs-5 me-1" /><span className="text-muted">Soft Cap:</span> &nbsp;10000 USD</li>
                                    <li className="h6 my-2 ms-0"><FiArrowRightCircle className="text-primary align-middle fs-5 me-1" /><span className="text-muted">Min. transaction Amount:</span> &nbsp;1000 USD</li>
                                    <li className="h6 my-2 ms-0"><FiArrowRightCircle className="text-primary align-middle fs-5 me-1" /><span className="text-muted">Target:</span> &nbsp;900000 USD</li>
                                </ul>

                                <div className="mt-4">
                                    <Link to="#" className="btn btn-primary w-100">Join Now</Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="section">
                <div className="container">
                    <div className="row justify-content-center">
                        <div className="col-12">
                            <div className="section-title text-center mb-4 pb-2">
                                <h4 className="title mb-3">It's easier than you think</h4>
                                <p className="text-muted para-desc mx-auto mb-0">With Cryptor Trade, you can be sure your trading skills are matched with excellent service.</p>
                            </div>
                        </div>
                    </div>

                    <div className="row justify-content-center">
                        {tokenAbout.map((item, index) => {
                            let Icon = item.icon
                            return (
                                <div className="col-lg-4 col-md-6 col-12 mt-4 pt-2" key={index}>
                                    <div className="feature feature-primary feature-clean rounded text-center px-4">
                                        <div className="icons text-center">
                                            <Icon className="icon d-block rounded-pill h3 mb-0 mx-auto" />
                                        </div>
                                        <div className="content mt-4">
                                            <Link to="#" className="text-dark h5 title">{item.title}</Link>
                                            <p className="text-muted mt-3 mb-0">{item.desc}</p>
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>

                <div className="container mt-100 mt-60">
                    <div className="row">
                        <div className="col-12">
                            <div className="section-title text-center mb-4 pb-2">
                                <h4 className="title mb-4">Success Roadmap</h4>
                                <p className="text-muted mx-auto para-desc mb-0">Explore and learn more about everything from machine learning and global payments to  scaling your team.</p>
                            </div>
                        </div>
                    </div>

                    <RoadMap />
                </div>

                <div className="container mt-100 mt-60">
                    <div className="row justify-content-center">
                        <div className="col-12">
                            <div className="section-title text-center mb-4 pb-2">
                                <h6 className="text-primary">Our Vision</h6>
                                <h4 className="title mb-3 mt-2">Cryptocurrency in Every Wallet</h4>

                                <p className="text-muted para-desc mx-auto mb-0">With Cryptor Trade, you can be sure your trading skills are matched with excellent service.</p>
                            </div>
                        </div>
                    </div>

                    <div className="row justify-content-center my-4 py-2">
                        <div className="col-md-6">
                            <img src={logoIcon} className="img-fluid" alt="" />
                        </div>
                    </div>

                    <div className="row justify-content-center">
                        {counterData.map((item, index) => {
                            return (
                                <div className="col-lg-3 col-md-6 mt-4 pt-2" key={index}>
                                    <div className="text-center">
                                        <h5 className="text-muted mb-0">{item.title}</h5>
                                        <h2 className="mb-0 display-5 mt-4 fw-bold text-primary"><CountUp className="counter-value" start={0} end={item.target} />{item.value}</h2>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </section>
            <Footer />
        </>
    )
}