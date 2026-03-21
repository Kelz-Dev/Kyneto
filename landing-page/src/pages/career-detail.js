import React from "react";
import { Link, useParams } from "react-router-dom";

import bg1 from '../assets/images/bg/market.png'
import { FiMapPin, FiArrowRight } from "../assets/icons/vander"

import Navbar from "../components/navbar";
import LinkTabTwo from "../components/linkTabTwo";
import Footer from "../components/footer";
import { jobData } from "../data/data";

export default function CareerDetail(){
    let params = useParams();
    let id = params.id
    let data = jobData.find((job) =>job.id === parseInt(id))
    return(
        <>
        <Navbar headClass="defaultscroll sticky" navClass="navigation-menu nav-right nav-light"/>

        <section className="bg-half-170 d-table w-100" style={{backgroundImage:`url(${bg1})`, backgroundPosition:'bottom'}}>
            <div className="bg-overlay bg-gradient-primary opacity-9"></div>
            <div className="container">
                <div className="row justify-content-center mt-5">
                    <div className="col-12">
                        <div className="section-title text-center">
                            <h4 className="title text-white fw-medium title-dark mb-4">{data?.title ? data.title : 'Business Development'}</h4>
                            <ul className="list-unstyled">
                                <li className="list-inline-item text-muted small me-3"><FiMapPin className="text-white title-dark h6 me-1 mb-0"/> Bothell, WA, USA - Full Time</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div> 
        </section>
        <LinkTabTwo/>

        <section className="section">
            <div className="container">
                <div className="row justify-content-center">
                    <div className="col-lg-9">
                        <h5 className="mb-3">Description:</h5>

                        <p className="text-muted">Our vision is to provide the next billion people with access to products that exemplify the ideals of Cryptor. These ideals - which include peer-to-peer transactions, decentralization, censorship resistance, and permissionless-ness - support economic freedom.</p>

                        <p className="text-muted">Our approach is to develop and promote widely accessible products that support economic freedom. For example, our digital wallet - which has 16 million downloads - provides people with an easy-to-use, non-custodial method for buying, selling, storing, sending, receiving, and trading cryptocurrencies.</p>

                        <h5 className="mb-3 mt-5">Duties:</h5>

                        <ul className="list-unstyled mb-0">
                            <li className="text-muted d-flex mt-2 ms-0"><FiArrowRight className="text-primary h5 mb-0 me-2"/> Work alongside Product, Engineering, Design and Marketing to build world-class cryptocurrency applications and experiences</li>
                            <li className="text-muted d-flex mt-2 ms-0"><FiArrowRight className="text-primary h5 mb-0 me-2"/> Provide producе vision and strategy for the team</li>
                            <li className="text-muted d-flex mt-2 ms-0"><FiArrowRight className="text-primary h5 mb-0 me-2"/> Design and lead a multi-year roadmap in accordance with company's OKRs, strategy and vision</li>
                            <li className="text-muted d-flex mt-2 ms-0"><FiArrowRight className="text-primary h5 mb-0 me-2" style={{width:'24px'}}/> Build and lead an exceptional engineering team to innovate, invent, implement and deploy complex software solutions in mission-critical environment</li>
                            <li className="text-muted d-flex mt-2 ms-0"><FiArrowRight className="text-primary h5 mb-0 me-2" style={{width:'24px'}}/> Understand customer needs and gather product requirements. Identify market opportunities and define product vision and strategy</li>
                        </ul>

                        <h5 className="mb-3 mt-5">Requirements</h5>
                        
                        <ul className="list-unstyled mb-0">
                            <li className="text-muted d-flex mt-2 ms-0"><FiArrowRight className="text-primary h5 mb-0 me-2" style={{width:'34px'}}/> 5+ years of Product Management, Product Marketing or Product Growth experience with creating product roadmaps from conception to launch, driving product vision and defining go-to-market strategy</li>
                            <li className="text-muted d-flex mt-2 ms-0"><FiArrowRight className="text-primary h5 mb-0 me-2"/> Has experience designing, implementing and/or integrating IAM solutions</li>
                            <li className="text-muted d-flex mt-2 ms-0"><FiArrowRight className="text-primary h5 mb-0 me-2"/> Has managed engineering teams, designers, and collaborated with other product people</li>
                            <li className="text-muted d-flex mt-2 ms-0"><FiArrowRight className="text-primary h5 mb-0 me-2"/> Strong project management skills and ability to work across different product teams</li>
                            <li className="text-muted d-flex mt-2 ms-0"><FiArrowRight className="text-primary h5 mb-0 me-2"/> Strong leadership skills</li>
                            <li className="text-muted d-flex mt-2 ms-0"><FiArrowRight className="text-primary h5 mb-0 me-2"/> Agile mindset to improve iteratively, rather than placing big long term bets</li>
                            <li className="text-muted d-flex mt-2 ms-0"><FiArrowRight className="text-primary h5 mb-0 me-2"/> Excellent communication skills</li>
                            <li className="text-muted d-flex mt-2 ms-0"><FiArrowRight className="text-primary h5 mb-0 me-2"/> Communicates well in both written and verbal English</li>
                        </ul>

                        <h5 className="mb-3 mt-5">Nice To Have</h5>
                        
                        <ul className="list-unstyled mb-0">                        
                            <li className="text-muted d-flex mt-2 ms-0"><FiArrowRight className="text-primary h5 mb-0 me-2"/> Strong understanding of blockchain, both technical and practical</li>
                            <li className="text-muted d-flex mt-2 ms-0"><FiArrowRight className="text-primary h5 mb-0 me-2"/> Cryptocurrency or financial services product management is a big plus</li>
                            <li className="text-muted d-flex mt-2 ms-0"><FiArrowRight className="text-primary h5 mb-0 me-2"/> Experience in KYC (know your customer), AML (anti-money laundering) and IAM services</li>
                            <li className="text-muted d-flex mt-2 ms-0"><FiArrowRight className="text-primary h5 mb-0 me-2"/> Understanding of custodial vs non-custodial aspects of cryptocurrency financial products</li>
                            <li className="text-muted d-flex mt-2 ms-0"><FiArrowRight className="text-primary h5 mb-0 me-2"/> Financial/payment apps experience</li>
                        </ul>

                        <h5 className="mb-3 mt-5">Benefits</h5>
                        <p className="text-muted">Bitcoin.com is paving the way for the next generation of financial technology products and platforms. We’re bringing cryptocurrency and the future of money to the masses. We’d love to have you on board.</p>

                        <p className="text-muted">We are serious about what we do, but more importantly, we have a lot of fun doing it. Our work culture is modern, meaning we strive for work experiences based on transparency, productivity, trust, and passion. For all employees, benefits include:</p>


                        <ul className="list-unstyled mb-0">
                            <li className="text-muted d-flex mt-2 ms-0"><FiArrowRight className="text-primary h5 mb-0 me-2"/> Flexible work hours</li>
                            <li className="text-muted d-flex mt-2 ms-0"><FiArrowRight className="text-primary h5 mb-0 me-2"/> Remote work</li>
                            <li className="text-muted d-flex mt-2 ms-0"><FiArrowRight className="text-primary h5 mb-0 me-2"/> Health insurance reimbursement</li>
                            <li className="text-muted d-flex mt-2 ms-0"><FiArrowRight className="text-primary h5 mb-0 me-2"/> Wellness program (gym, etc.)</li>
                            <li className="text-muted d-flex mt-2 ms-0"><FiArrowRight className="text-primary h5 mb-0 me-2"/> Yoga classes</li>
                            <li className="text-muted d-flex mt-2 ms-0"><FiArrowRight className="text-primary h5 mb-0 me-2"/> Japanese classes</li>
                        </ul>

                        <p className="text-muted">For employees residing in Japan, we offer "permanent employment" status (正社員) and the option to be paid in yen.</p>

                        <p className="text-muted">Employees residing outside of Japan are classified as Independent Contractors and are paid in the cryptocurrency of their choice.</p>

                        <div className="mt-4">
                            <Link to="/career-apply-form" className="btn btn-primary">Apply now</Link>
                        </div>
                    </div>
                </div>
            </div>
        </section>
        <Footer/>
        </>
    )
}