import React from "react";
import { Link } from "react-router-dom";

import bg1 from '../assets/images/bg/market.png'

import Navbar from "../components/navbar";
import Charts from "../components/chart";
import Trade from "../components/trade";
import Footer from "../components/footer";

export default function MarketPrice(){
    return(
        <>
        <Navbar headClass="defaultscroll sticky" navClass="navigation-menu nav-right nav-light"/>
        <section className="bg-half-170 d-table w-100" style={{backgroundImage:`url(${bg1})`, backgroundPosition:'bottom'}}>
            <div className="bg-overlay bg-gradient-primary opacity-9"></div>
            <div className="container">
                <div className="row justify-content-center mt-5">
                    <div className="col-12">
                        <div className="section-title text-center">
                            <span className="text-white-50">In the past 24 hours</span>
                            <h4 className="text-white title-dark mt-2 mb-4">Market is up <span className="text-success">15.78%</span></h4>
                            <p className="text-white-50 para-desc mx-auto mb-0">With Cryptor Trade, you can be sure your trading skills are matched with excellent service.</p>

                            <div className="subcribe-form mt-4 pt-2">
                                <form className="m-0 mx-auto">
                                    <div className="">
                                        <input type="text" id="course" name="name" className="rounded bg-white opacity-7" placeholder="Search assets..."/>
                                        <button type="submit" className="btn btn-primary">Search</button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <section className="section">
            <div className="container">
                <div className="row">
                    <div className="col-12">
                        <div className="section-title mb-4">
                            <h4>Top Movers</h4>
                        </div>
                    </div>
                </div>

                <Charts/>

                <div className="row justify-content-center">
                    <div className="col-12 mt-4 pt-2">
                        <div className="table-responsive bg-white shadow rounded">
                            <Trade/>
                        </div>
                    </div>

                    <div className="col-12 mt-4 pt-2">
                        <div className="d-md-flex align-items-center text-center justify-content-between">
                            <span className="text-muted me-3">Showing 1 - 10 out of 452</span>
                            <ul className="pagination justify-content-center mb-0 mt-3 mt-sm-0">
                                <li className="page-item ms-0"><Link className="page-link" to="#" aria-label="Previous">Prev</Link></li>
                                <li className="page-item ms-0 active"><Link className="page-link" to="#">1</Link></li>
                                <li className="page-item ms-0"><Link className="page-link" to="#">2</Link></li>
                                <li className="page-item ms-0"><Link className="page-link" to="#">3</Link></li>
                                <li className="page-item ms-0"><Link className="page-link" to="#" aria-label="Next">Next</Link></li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </section>
        <Footer/>
        </>
    )
}