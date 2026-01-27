import React from "react";
import { Link } from "react-router-dom";

import logoIcon from '../assets/images/icon-gradient.png'
import client from '../assets/images/client/01.jpg'

import Navbar from "../nftComponents/navbar";
import Footer from "../nftComponents/footer";

export default function NftCreatorSetting(){
    return(
        <>
        <Navbar headClass="defaultscroll sticky" navClass="navigation-menu nav-right"/>

        <section className="bg-half-100 bg-light d-table w-100">
            <div className="container position-relative" style={{zIndex:'1'}}>
                <div className="row justify-content-center mt-5">
                    <div className="col-12">
                        <div className="section-title text-center">
                            <h4 className="title fw-medium mb-4">Profile Settings</h4>
                            <p className="text-muted para-desc mx-auto mb-0">Cryptor NFT Marketplace, you can be sure your trading skills are matched with excellent service.</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="position-absolute top-50 start-50 mt-4 translate-middle">
                <img src={logoIcon} className="img-fluid opacity-2" style={{maxHeight:'300px'}} alt=""/>
            </div>
        </section>

        <section className="section">
            <div className="container">
                <div className="row justify-content-center">
                    <div className="col-lg-9">
                        <div className="rounded shadow">
                            <div className="p-4 border-bottom">
                                <h5 className="mb-0">Personal Information :</h5>
                            </div>

                            <div className="p-4 border-bottom">
                                <div className="row align-items-center">
                                    <div className="col-lg-2 col-md-2">
                                        <img src={client} className="avatar avatar-md-md rounded-pill shadow mx-auto d-block" alt=""/>
                                    </div>

                                    <div className="col-lg-5 col-md-5 text-center text-md-start mt-4 mt-sm-0">
                                        <h5 className="">Upload your picture</h5>
                                        <p className="text-muted mb-0">For best results, use an image at least 256px by 256px in either .jpg or .png format</p>
                                    </div>

                                    <div className="col-lg-5 col-md-5 text-md-end text-center mt-4 mt-sm-0">
                                        <Link to="#" className="btn btn-primary">Upload</Link>
                                        <Link to="#" className="btn btn-soft-primary ms-2">Remove</Link>
                                    </div>
                                </div>
                            </div>

                            <div className="p-4">
                                <form>
                                    <div className="row">
                                        <div className="col-md-6">
                                            <div className="mb-3">
                                                <label className="form-label">First Name</label>
                                                <input name="name" id="name" type="text" className="form-control" placeholder="First Name :"/>
                                            </div>
                                        </div>

                                        <div className="col-md-6">
                                            <div className="mb-3">
                                                <label className="form-label">Last Name</label>
                                                <input name="name" id="name2" type="text" className="form-control" placeholder="Last Name :"/>
                                            </div>
                                        </div>

                                        <div className="col-md-6">
                                            <div className="mb-3">
                                                <label className="form-label">Your Email</label>
                                                <input name="email" id="email" type="email" className="form-control" placeholder="Your email :"/>
                                            </div> 
                                        </div>

                                        <div className="col-md-6">
                                            <div className="mb-3">
                                                <label className="form-label">Phone no.</label>
                                                <input name="number" id="number" type="text" className="form-control" placeholder="Phone no. :"/>
                                            </div>                                                                               
                                        </div>

                                        <div className="col-md-12">
                                            <div className="mb-3">
                                                <label className="form-label">Your Bio Here</label>
                                                <textarea name="comments" id="comments" rows="4" className="form-control" placeholder="Bio :"></textarea>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="row">
                                        <div className="col-sm-12">
                                            <input type="submit" id="submit" name="send" className="btn btn-primary" value="Save changes"/>
                                        </div>
                                    </div>
                                </form> 
                            </div>
                        </div>

                        <div className="rounded shadow mt-4">
                            <div className="p-4 border-bottom">
                                <h5 className="mb-0">Change Password :</h5>
                            </div>

                            <div className="p-4">
                                <form>
                                    <div className="row">
                                        <div className="col-lg-12">
                                            <div className="mb-3">
                                                <label className="form-label">Old password :</label>
                                                <input type="password" className="form-control" placeholder="Old password" required=""/>
                                            </div>
                                        </div>
    
                                        <div className="col-lg-12">
                                            <div className="mb-3">
                                                <label className="form-label">New password :</label>
                                                <input type="password" className="form-control" placeholder="New password" required=""/>
                                            </div>
                                        </div>
    
                                        <div className="col-lg-12">
                                            <div className="mb-3">
                                                <label className="form-label">Re-type New password :</label>
                                                <input type="password" className="form-control" placeholder="Re-type New password" required=""/>
                                            </div>
                                        </div>
    
                                        <div className="col-lg-12 mt-2 mb-0">
                                            <button className="btn btn-primary">Save password</button>
                                        </div>
                                    </div>
                                </form>
                            </div>
                        </div>

                        <div className="rounded shadow mt-4">
                            <div className="p-4 border-bottom">
                                <h5 className="mb-0">Account Notifications :</h5>
                            </div>

                            <div className="p-4">
                                <div className="d-flex justify-content-between pb-4">
                                    <h5 className="mb-0">When someone mentions me</h5>
                                    <div className="form-check">
                                        <input className="form-check-input" type="checkbox" defaultValue="" id="flexCheckDefault1"/>
                                        <label className="form-check-label" htmlFor="flexCheckDefault1"></label>
                                    </div>
                                </div>
                                <div className="d-flex d-flex justify-content-between py-4 border-top">
                                    <h5 className="mb-0">When someone follows me</h5>
                                    <div className="form-check">
                                        <input className="form-check-input" type="checkbox" defaultValue="" id="flexCheckDefault2" defaultChecked/>
                                        <label className="form-check-label" htmlFor="flexCheckDefault2"></label>
                                    </div>
                                </div>
                                <div className="d-flex d-flex justify-content-between py-4 border-top">
                                    <h5 className="mb-0">When shares my activity</h5>
                                    <div className="form-check">
                                        <input className="form-check-input" type="checkbox" defaultValue="" id="flexCheckDefault3"/>
                                        <label className="form-check-label" htmlFor="flexCheckDefault3"></label>
                                    </div>
                                </div>
                                <div className="d-flex d-flex justify-content-between py-4 border-top">
                                    <h5 className="mb-0">When someone messages me</h5>
                                    <div className="form-check">
                                        <input className="form-check-input" type="checkbox" defaultValue="" id="flexCheckDefault4" defaultChecked/>
                                        <label className="form-check-label" htmlFor="flexCheckDefault4"></label>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="rounded shadow mt-4">
                            <div className="p-4 border-bottom">
                                <h5 className="mb-0">Marketing Notifications :</h5>
                            </div>

                            <div className="p-4">
                                <div className="d-flex d-flex justify-content-between pb-4">
                                    <h5 className="mb-0">There is a sale or promotion</h5>
                                    <div className="form-check">
                                        <input className="form-check-input" type="checkbox" defaultValue="" id="flexCheckDefault5"/>
                                        <label className="form-check-label" htmlFor="flexCheckDefault5"></label>
                                    </div>
                                </div>
                                <div className="d-flex d-flex justify-content-between py-4 border-top">
                                    <h5 className="mb-0">Company news</h5>
                                    <div className="form-check">
                                        <input className="form-check-input" type="checkbox" defaultValue="" id="flexCheckDefault6" defaultChecked/>
                                        <label className="form-check-label" htmlFor="flexCheckDefault6"></label>
                                    </div>
                                </div>
                                <div className="d-flex d-flex justify-content-between py-4 border-top">
                                    <h5 className="mb-0">Weekly jobs</h5>
                                    <div className="form-check">
                                        <input className="form-check-input" type="checkbox" defaultValue="" id="flexCheckDefault7"/>
                                        <label className="form-check-label" htmlFor="flexCheckDefault7"></label>
                                    </div>
                                </div>
                                <div className="d-flex d-flex justify-content-between py-4 border-top">
                                    <h5 className="mb-0">Unsubscribe News</h5>
                                    <div className="form-check">
                                        <input className="form-check-input" type="checkbox" defaultValue="" id="flexCheckDefault8" defaultChecked/>
                                        <label className="form-check-label" htmlFor="flexCheckDefault8"></label>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="rounded shadow mt-4">
                            <div className="p-4 border-bottom">
                                <h5 className="mb-0 text-danger">Delete Account :</h5>
                            </div>

                            <div className="p-4">
                                <h5 className="mb-0">Do you want to delete the account? Please press below "Delete" button</h5>
                                <div className="mt-4">
                                    <button className="btn btn-danger">Delete Account</button>
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