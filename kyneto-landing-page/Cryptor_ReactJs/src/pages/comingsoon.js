import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";

import bg1 from '../assets/images/bg/user.jpg'
import logoLight from '../assets/images/logo-light.png'

import { VscRefresh } from '../assets/icons/vander'

export default function Comingsoon() {
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
        <section className="bg-home d-flex align-items-center position-relative" style={{ backgroundImage: `url(${bg1})`, backgroundPosition: 'center' }}>
            <div className="bg-overlay bg-gradient-primary opacity-8"></div>
            <div className="container">
                <div className="row justify-content-center">
                    <div className="col-lg-8 col-md-12 text-center">
                        <Link to="/index" className="logo h5"><img src={logoLight} height="40" alt="" /></Link>
                        <h4 className="display-6 fw-medium text-uppercase title-dark text-white mt-2 mb-4">We're Coming soon...</h4>
                        <p className="text-light para-desc para-dark mx-auto">With Kyneto Trade, you can be sure your trading skills are matched with excellent service.</p>
                    </div>
                </div>

                <div className="row">
                    <div className="col-md-12 text-center">
                        <div id="countdown">
                            <ul className="count-down list-unstyled">
                                <li id="days" className="count-number list-inline-item m-2">{days}<p className='count-head'>Days</p> </li>
                                <li id="hours" className="count-number list-inline-item m-2">{hours}<p className='count-head'>Hours</p></li>
                                <li id="mins" className="count-number list-inline-item m-2">{minutes}<p className='count-head'>Mins</p></li>
                                <li id="secs" className="count-number list-inline-item m-2">{seconds}<p className='count-head'>Secs</p></li>
                                <li id="end" className="h1"></li>
                            </ul>
                        </div>
                    </div>
                </div>
                <div className="row">
                    <div className="col-md-12 text-center">
                        <Link to="/index" className="btn btn-primary mt-4"><VscRefresh /> Go Back Home</Link>
                    </div>
                </div>
            </div>
        </section>
    )
}