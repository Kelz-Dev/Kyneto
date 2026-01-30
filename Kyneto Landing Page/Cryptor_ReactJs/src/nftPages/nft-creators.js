import React,{useState} from "react";
import { Link } from "react-router-dom";

import logoIcon from '../assets/images/icon-gradient.png'

import Footer from "../nftComponents/footer";
import Navbar from "../nftComponents/navbar";

import { creatorData } from "../data/nftdata";

export default function NftCreatore(){

  const [searchItem, setSearchItem] = useState('')
  const [filteredUsers, setFilteredUsers] = useState(creatorData)

  const handleInputChange = (e) => { 
    const searchTerm = e.target.value;
    setSearchItem(searchTerm)

    const filteredItems = creatorData.filter((creator) =>
    creator.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    setFilteredUsers(filteredItems);
  }

    return(
        <>
        <Navbar headClass="defaultscroll sticky" navClass="navigation-menu nav-right"/>
        <section className="bg-half-100 bg-light d-table w-100">
            <div className="container position-relative" style={{zIndex:'1'}}>
                <div className="row justify-content-center mt-5">
                    <div className="col-12">
                        <div className="section-title text-center">
                            <h4 className="title fw-medium mb-4">All Creators & Artist</h4>
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
                <div className="row align-items-center justify-content-between">
                    <div className="col-md-8">
                        <div style={{maxWidth:'400px'}}>
                            <div className="widget">
                                <div id="search2" className="widget-search mb-0">
                                    <form role="search" method="get" id="searchform" className="searchform">
                                        <div>
                                            <input type="text" className="border rounded" name="s" id="s" placeholder="Search Keywords..."  value={searchItem} onChange={handleInputChange}/>
                                            <input type="submit" id="searchsubmit" value="Search"/>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="col-md-4 mt-4 mt-sm-0">
                        <div style={{maxWidth:'180px'}} className="ms-auto">
                            <select id="select-items" className="form-select">
                                <option defaultValue="1">Rating</option>
                                <option defaultValue="2">View</option>
                                <option defaultValue="3">Popularity</option>
                                <option defaultValue="4">Verified</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className="row">
                    {filteredUsers.map((item,index) =>{
                        return(
                            <div className="col-lg-3 col-md-4 mt-4 pt-2" key={index}>
                                <div className="card nft-creator nft-creator-primary border-0 rounded-md shadow">
                                    <div className="position-relative">
                                        <img src={item.image} className="img-fluid rounded-md" alt=""/>

                                        <div className="position-absolute top-100 start-50 translate-middle">
                                            <img src={item.client} className="avatar avatar-small d-block mx-auto rounded-pill" alt=""/>
                                        </div>
                                    </div>

                                    <div className="content text-center mt-4">
                                        <div className="card-body author">
                                            <Link to={`/nft-creator-profile/${item.id}`} className="text-dark h6 name text-capitalize">{item.name}</Link>
                                            <small className="d-block text-muted text-lowercase">{item.tag}</small>

                                            <div className="d-flex text-start align-items-end justify-content-between mt-4">
                                                <div>
                                                    <span className="text-muted d-block">Followers:</span>
                                                    <span className="d-block text-dark">{item.followers}</span>
                                                </div>

                                                <Link to="#" className="btn btn-sm">Follow</Link>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>

                <div className="row">
                    <div className="col-12 mt-4 pt-2">
                        <div className="d-md-flex align-items-center text-center justify-content-between">
                            <span className="text-muted me-3">Showing 1 - 8 out of 50</span>
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