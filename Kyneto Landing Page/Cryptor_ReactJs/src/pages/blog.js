import React from "react";
import { Link } from "react-router-dom";

import bg1 from '../assets/images/bg/market.png'

import Navbar from "../components/navbar";
import Footer from "../components/footer";

import { blogData } from "../data/data";
import { FiArrowRight } from '../assets/icons/vander'

export default function Blog() {
    return (
        <>
            <Navbar headClass="defaultscroll sticky" navClass="navigation-menu nav-right nav-light" />

            <section className="bg-half-170 d-table w-100" style={{ backgroundImage: `url(${bg1})`, backgroundPosition: 'bottom' }}>
                <div className="bg-overlay bg-gradient-primary opacity-9"></div>
                <div className="container">
                    <div className="row justify-content-center mt-5">
                        <div className="col-12">
                            <div className="section-title text-center">
                                <h4 className="title text-white title-dark fw-medium mb-4">Blog & News</h4>
                                <p className="text-white-50 para-desc mx-auto mb-0">With Cryptor Trade, you can be sure your trading skills are matched with excellent service.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
            <section className="section">
                <div className="container">
                    <div className="row g-4">
                        {blogData.map((item, index) => {
                            return (
                                <div className="col-lg-4 col-md-6 col-12" key={index}>
                                    <div className="card blog blog-primary border-0 rounded shadow overflow-hidden">
                                        <img src={item.image} className="img-fluid" alt="" />

                                        <div className="card-body">
                                            <div className="d-flex justify-content-between align-items-center mb-3">
                                                <span className="badge bg-soft-primary">{item.tag}</span>
                                                <span className="text-muted">{item.date}</span>
                                            </div>
                                            <Link to={`/blog-detail/${item.id}`} className="title text-dark h5">{item.title}</Link>

                                            <div className="mt-3">
                                                <Link to={`/blog-detail/${item.id}`} className="link">Read More <FiArrowRight /></Link>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>

                    <div className="row">
                        <div className="col-12 mt-4 pt-2">
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
                                            <input type="email" id="email" name="email" className="bg-white rounded" required placeholder="Enter your email address" />
                                            <button type="submit" className="btn btn-primary">Notify me</button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
            <Footer />
        </>
    )
}