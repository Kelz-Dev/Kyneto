import { GoShieldCheck, LiaNewspaper, PiBrowsersBold, FaApple, AiFillAndroid, PiGooglePlayLogo, TbDeviceHeartMonitor, BsWindows, FaLinux, LuPencil, FaBitcoin, FiClipboard, FaMoneyBillAlt, FiAirplay, AiOutlineEuroCircle, MdOutlineDesktopWindows, LuUserCheck2, BsQrCodeScan, LiaUniversitySolid, LuShovel, TbServicemark, LuShieldCheck, MdOutlineTimerOff, BsExclamationOctagon, FaMoneyBill, MdOutlineBorderOuter, FaRegComment, LuMailQuestion, SiSimpleanalytics, FiVideo, FiCrop, LuBook, FiFileText, FiTag, FiCpu, MdFlip, PiCalculator, LuHeart, TbMoodNerd, RiQuestionLine, FiSettings } from '../assets/icons/vander'
import coin1 from '../assets/images/coin/bitcoin.png'
import coin2 from '../assets/images/coin/ethereum.png'
import coin3 from '../assets/images/coin/monero.png'
import coin4 from '../assets/images/coin/litecoin.png'
import coin5 from '../assets/images/coin/auroracoin.png'
import coin6 from '../assets/images/coin/avalanche.png'
import coin7 from '../assets/images/coin/binance.png'
import coin8 from '../assets/images/coin/bitcoin-cash.png'
import coin9 from '../assets/images/coin/bittorrent.png'
import coin10 from '../assets/images/coin/blocknet.png'
import coin11 from '../assets/images/coin/coinye.png'
import coin12 from '../assets/images/coin/kucoin.png'
import coin13 from '../assets/images/coin/potcoin.png'
import coin14 from '../assets/images/coin/primecoin.png'
import coin15 from '../assets/images/coin/zcash.png'

import client1 from '../assets/images/client/01.jpg'
import client2 from '../assets/images/client/02.jpg'
import client3 from '../assets/images/client/03.jpg'
import client4 from '../assets/images/client/04.jpg'
import client5 from '../assets/images/client/05.jpg'
import client6 from '../assets/images/client/06.jpg'
import client7 from '../assets/images/client/07.jpg'
import client8 from '../assets/images/client/08.jpg'

import partner1 from '../assets/images/client/amazon.svg'
import partner2 from '../assets/images/client/google.svg'
import partner3 from '../assets/images/client/lenovo.svg'
import partner4 from '../assets/images/client/paypal.svg'
import partner5 from '../assets/images/client/shopify.svg'
import partner6 from '../assets/images/client/spotify.svg'

import proccess1 from '../assets/images/svg-coin/cpu.svg'
import proccess2 from '../assets/images/svg-coin/analytics.svg'
import proccess3 from '../assets/images/svg-coin/exchange.svg'
import proccess4 from '../assets/images/svg-coin/money.svg'
import proccess5 from '../assets/images/svg-coin/wallet.svg'

import blog1 from '../assets/images/blog/01.jpg'
import blog2 from '../assets/images/blog/02.jpg'
import blog3 from '../assets/images/blog/03.jpg'
import blog4 from '../assets/images/blog/04.jpg'
import blog5 from '../assets/images/blog/05.jpg'
import blog6 from '../assets/images/blog/06.jpg'
import blog7 from '../assets/images/blog/07.jpg'
import blog8 from '../assets/images/blog/08.jpg'

export const chartData = []
/*
export const chartData = [
    {
        image: coin1,
        // ... (rest of the array)
    },
    // ...
]
*/

export const aboutData = [
    {
        icon: GoShieldCheck,
        title: 'Decentralized Proofs',
        desc: 'Kyneto uses Proof of Spacetime (PoSt) to ensure your data is persistently stored and verified.'
    },
    {
        icon: LiaNewspaper,
        title: 'Incentive Layer',
        desc: 'A robust economic model that rewards providers for honest storage and slashes malicious actors.'
    },
    {
        icon: PiBrowsersBold,
        title: 'Merkle Verification',
        desc: 'Cryptographic integrity checks ensure that every byte of your data remains untampered.'
    },
]
export const appLink = [
    {
        icon: FaApple,
        title: 'App Store'
    },
    {
        icon: AiFillAndroid,
        title: 'Android APK'
    },
    {
        icon: PiGooglePlayLogo,
        title: 'Play Store'
    },
    {
        icon: TbDeviceHeartMonitor,
        title: 'MacOS'
    },
    {
        icon: BsWindows,
        title: 'Windows'
    },
    {
        icon: FaLinux,
        title: 'Linux'
    },
]
export const successMap = [
    {
        icon: LuPencil,
        date: 'Q1 2025',
        title: 'Protocol Simulation & Synthetic Data Engineering',
        bg: false
    },
    {
        icon: FaBitcoin,
        date: 'Q2 2025',
        title: 'Kyneto Testnet Alpha on Polygon Amoy',
        bg: false
    },
    {
        icon: FiClipboard,
        date: 'Q3 2025',
        title: 'Incentive Layer Implementation & Provider Beta',
        bg: false
    },
    {
        icon: FaMoneyBillAlt,
        date: 'Q4 2025',
        title: 'Security Audits & Public Testnet',
        bg: true
    },
    {
        icon: FiAirplay,
        date: 'Q1 2026',
        title: 'Mainnet Phase 1 & Token Generation Event (TGE)',
        bg: false
    },
    {
        icon: FiAirplay,
        date: 'Q2 2026',
        title: 'Institutional Integration & Marketplace Expansion',
        bg: false
    },
]
export const clientData = []
/*
export const clientData = [
    {
        image: client1,
        // ... (rest of the array)
    },
    // ...
]
*/
export const coinImg = [coin1, coin2, coin3, coin4, coin5, coin6, coin7, coin8, coin9, coin10, coin11, coin12, coin13, coin14, coin15]
export const counterData = [
    {
        title: 'Founded in',
        target: '2024',
        value: ''
    },
    {
        title: 'Team Member',
        target: '50',
        value: '+'
    },
    {
        title: 'Storage Providers',
        target: '500',
        value: '+'
    },
    {
        title: 'Data Secured (PB)',
        target: '10',
        value: '+'
    },
]
export const companyPartner = [partner1, partner2, partner3, partner4, partner5, partner6]

export const tradeData = [
    {
        image: coin1,
        name: 'Bitcoin',
        tag: 'BTC',
        price: '$34587',
        change1: '-2.5%',
        change2: '-$745',
        marketcap: '$725,354M',
        profit: false
    },
    {
        image: coin4,
        name: 'Litecoin',
        tag: 'LTC',
        price: '$216',
        change1: '+.264%',
        change2: '+$.264',
        marketcap: '$11,100M',
        profit: true
    },
    {
        image: coin5,
        name: 'Auroracoin',
        tag: 'ARC',
        price: '$452',
        change1: '-1.9%',
        change2: '-$1.9',
        marketcap: '$45,785M',
        profit: false
    },
    {
        image: coin11,
        name: 'Coinye',
        tag: 'CNY',
        price: '$154',
        change1: '+1.05%',
        change2: '+$1.05',
        marketcap: '$85,478M',
        profit: true
    },
    {
        image: coin2,
        name: 'Ethereum Coin',
        tag: 'ETH',
        price: '$854',
        change1: '+1.705%',
        change2: '+$1.705',
        marketcap: '$112,452M',
        profit: true
    },
    {
        image: coin13,
        name: 'Potcoin',
        tag: 'PTC',
        price: '$548',
        change1: '-3.2%',
        change2: '-$3.2',
        marketcap: '$4,712M',
        profit: false
    },
    {
        image: coin15,
        name: 'Zcash Coin',
        tag: 'ZCC',
        price: '$965',
        change1: '+1.465%',
        change2: '+$1.465',
        marketcap: '$487,552M',
        profit: true
    },
    {
        image: coin14,
        name: 'Prime coin',
        tag: 'XPM',
        price: '$4875',
        change1: '-1.08%',
        change2: '-$1.08',
        marketcap: '$55,221M',
        profit: false
    },
    {
        image: coin10,
        name: 'Blocknet',
        tag: 'BLOCK',
        price: '$478',
        change1: '+2.8%',
        change2: '+$2.8',
        marketcap: '$66,552M',
        profit: true
    },

]

export const teamData = [
    {
        image: client1,
        name: 'Calvin Carlo',
        title: 'Founder / C.E.O'
    },
    {
        image: client2,
        name: 'Janalia Joseph',
        title: 'Co-Founder'
    },
    {
        image: client3,
        name: 'Miriam Coll',
        title: 'C.O.O'
    },
    {
        image: client4,
        name: 'Cristino Murphy',
        title: 'Marketing'
    },
    {
        image: client5,
        name: 'Marketing',
        title: 'Graphic Designer'
    },
    {
        image: client6,
        name: 'Amy Ford',
        title: 'Co-Founder'
    },
    {
        image: client7,
        name: 'Jane Mille',
        title: 'C.O.O'
    },
    {
        image: client8,
        name: 'Alex Tonmoy',
        title: 'Marketing'
    },
]

export const accordionData = [
    {
        id: 1,
        title: 'What is Kyneto?',
        desc: 'Kyneto is a decentralized storage protocol built on top of IPFS, providing a persistent and incentivized layer for data storage.'
    },
    {
        id: 2,
        title: 'How does the Incentive Layer work?',
        desc: 'Providers pledge storage and stake KYN tokens. They are rewarded for providing proofs of storage and slashed if they fail to do so.'
    },
    {
        id: 3,
        title: 'Why choose Kyneto over Filecoin?',
        desc: 'Kyneto focuses on high-performance, verifiable storage with a more accessible provider stack and seamless IPFS integration.'
    },
    {
        id: 4,
        title: 'How do I become a provider?',
        desc: 'You can join the network by running the Kyneto Provider Daemon and pledging your available disk space.'
    },
]
export const tokenAbout = [
    {
        icon: LuUserCheck2,
        title: 'Verify your identity',
        desc: 'If you’re a new customer you have to do a one-time-only verification of your identify'
    },
    {
        icon: BsQrCodeScan,
        title: 'Sale the Bitcoin',
        desc: 'Choose the currency and how much you want to sell and you’ll be given an address to send to'
    },
    {
        icon: LiaUniversitySolid,
        title: 'Money in your bank account',
        desc: 'Once the transaction is confirmed you will receive the money in your bank account'
    },
]
export const listingData = [
    {
        image: coin1,
        name: 'Bitcoin',
        tag: 'BTC',
        status: 'Active',
        rate: '4.5',
        fund: '$ 600000',
        progress: '60%',
        date: '13th Sep 2023'
    },
    {
        image: coin4,
        name: 'Litecoin',
        tag: 'LTC',
        status: 'Ended',
        rate: '4.0',
        fund: '$ 550000',
        progress: '100%',
        date: '29th Nov 2023'
    },
    {
        image: coin5,
        name: 'Auroracoin',
        tag: 'ARC',
        status: 'Upcoming',
        rate: 'No rating',
        fund: '$ 0',
        progress: '0%',
        date: '29th Dec 2023'
    },
    {
        image: coin11,
        name: 'Coinye',
        tag: 'CNY',
        status: 'Active',
        rate: '4.5',
        fund: '$ 600000',
        progress: '60%',
        date: '13th Mar 2023'
    },
    {
        image: coin2,
        name: 'Ethereum Coin',
        tag: 'ETH',
        status: 'Active',
        rate: '4.5',
        fund: '$ 600000',
        progress: '60%',
        date: '5th May 2023'
    },
    {
        image: coin13,
        name: 'Potcoin',
        tag: 'PTC',
        status: 'Ended',
        rate: '4.5',
        fund: '$ 600000',
        progress: '100%',
        date: '19th June 2023'
    },
    {
        image: coin14,
        name: 'Prime coin',
        tag: 'XPM',
        status: 'Upcoming',
        rate: 'No rating',
        fund: '$ 0',
        progress: '0%',
        date: '20th June 2023'
    },
    {
        image: coin10,
        name: 'Blocknet',
        tag: 'BLOCK',
        status: 'Ended',
        rate: '4.5',
        fund: '$ 700000',
        progress: '100%',
        date: '31st Aug 2023'
    },
    {
        image: coin12,
        name: 'Kucoin',
        tag: 'KCS',
        status: 'Active',
        rate: '4.5',
        fund: '$ 600000',
        progress: '60%',
        date: '1st Sep 2023'
    },
    {
        image: coin9,
        name: 'Bittorrent',
        tag: 'BTT',
        status: 'Active',
        rate: '4.5',
        fund: '$ 600000',
        progress: '60%',
        date: '13th Mar 2023'
    },
    {
        image: coin6,
        name: 'Avalanche',
        tag: 'AVAX',
        status: 'Upcoming',
        rate: 'No rating',
        fund: '$ 0',
        progress: '0%',
        date: '5th May 2023'
    },
    {
        image: coin8,
        name: 'Bitcoin cash',
        tag: 'BCS',
        status: 'Ended',
        rate: '4.5',
        fund: '$ 900000',
        progress: '100%',
        date: '19th June 2023'
    },
    {
        image: coin7,
        name: 'Binance',
        tag: 'BTC',
        status: 'Active',
        rate: '4.5',
        fund: '$ 600000',
        progress: '60%',
        date: '20th June 2023'
    },
    {
        image: coin3,
        name: 'Monero',
        tag: 'XMR',
        status: 'Ended',
        rate: '4.5',
        fund: '$ 800000',
        progress: '100%',
        date: '1st Sep 2023'
    }
]
export const clientReview = [
    {
        image: client1,
        name: 'Thomas Israel',
        title: 'C.E.O',
        desc: '" It seems that only fragments of the original text remain in the used today. Which is said to have originated in the 16th century. "'
    },
    {
        image: client2,
        name: 'Carl Oliver',
        title: 'P.A',
        desc: '" The advantage of its Latin origin and the relative to itself or distract the viewers attention from the layout. "'
    },
    {
        image: client3,
        name: 'Barbara McIntosh',
        title: 'M.D',
        desc: '" There is now an abundance of readable dummy texts. These alternatives to the and tell short, funny or nonsensical stories. "'
    },
    {
        image: client4,
        name: 'Christa Smith',
        title: 'Manager',
        desc: '" According to most sources. Allegedly, a Latin scholar established the of the unusual word consectetur he could find "'
    },
    {
        image: client5,
        name: 'Dean Tolle',
        title: 'Developer',
        desc: '" It seems that only fragments of the original text remain in the used today. Which is said to have originated in the 16th century. "'
    },
    {
        image: client6,
        name: 'Jill Webb',
        title: 'Designer',
        desc: '" It seems that only fragments of the original text remain in the used today. Which is said to have originated in the 16th century. "'
    },
]
export const tradeProccess = [
    {
        image: proccess1,
        name: 'Buy & Sell Crypto',
        desc: 'Buy or sell Bitcoin, Ethereum, and other crypto assets with your credit card, debit card, or bank account.',
        title: 'Buy Bitcoin'
    },
    {
        image: proccess2,
        name: 'Trade Assets',
        desc: 'Discover new and innovative crypto assets with over 200 spot trading pairs and 25 margin trading pairs.',
        title: 'View Exchange'
    },
    {
        image: proccess3,
        name: 'Hedge with Poloniex Futures',
        desc: 'Trade Bitcoin, Ethereum, and other perpetual with up to 100x leverage on Poloniex Futures.',
        title: 'Trade Futures'
    },
    {
        image: proccess4,
        name: 'Earn Rewards for Trading',
        desc: 'Never miss an opportunity for a little competition. Join our latest campaigns to earn rewards.',
        title: 'Join Competition'
    },
]
export const services = [
    {
        icon: LuShovel,
        title: 'Support',
        desc: 'This is required when, for text is not yet available.',
        bg: false
    },
    {
        icon: TbServicemark,
        title: 'Service Level',
        desc: 'This is required when, for text is not yet available.',
        bg: true
    },
    {
        icon: LuShieldCheck,
        title: 'Take profit / Stoploss',
        desc: 'This is required when, for text is not yet available.',
        bg: false
    },
    {
        icon: MdOutlineTimerOff,
        title: 'Trailing Stop',
        desc: 'This is required when, for text is not yet available.',
        bg: true
    },
    {
        icon: BsExclamationOctagon,
        title: 'Pending Orders',
        desc: 'This is required when, for text is not yet available.',
        bg: false
    },
    {
        icon: FaMoneyBill,
        title: 'Platform Fees',
        desc: 'This is required when, for text is not yet available.',
        bg: true
    },
]
export const careerValue = [
    {
        image: proccess1,
        title: 'User-Focused',
        desc: "We protect our users by putting our users' needs first and delivering quality service."
    },
    {
        image: proccess2,
        title: 'Collaboration',
        desc: "We work as a team towards shared goals to build the ecosystem together."
    },
    {
        image: proccess3,
        title: 'Hardcore',
        desc: "We are results driven. We get things done. We are passionate and work hard."
    },
    {
        image: proccess4,
        title: 'Integrity',
        desc: "We are accountable for our actions. When we make mistakes, we fix them."
    },
    {
        image: proccess5,
        title: 'Freedom',
        desc: "We execute responsibly and autonomously. We empower those around us."
    },
]
export const jobData = [
    {
        id: 1,
        icon: MdOutlineBorderOuter,
        title: 'Business Development'
    },
    {
        id: 2,
        icon: FaRegComment,
        title: 'Communications'
    },
    {
        id: 3,
        icon: LuMailQuestion,
        title: 'Customer Support'
    },
    {
        id: 4,
        icon: SiSimpleanalytics,
        title: 'Data Analytics & Research'
    },
    {
        id: 5,
        icon: FiVideo,
        title: 'Editorial & Video'
    },
    {
        id: 6,
        icon: FiCrop,
        title: 'Engineering'
    },
    {
        id: 7,
        icon: LuBook,
        title: 'Finance & Administration'
    },
    {
        id: 8,
        icon: FiFileText,
        title: 'Legal & Compliance'
    },
    {
        id: 9,
        icon: FiTag,
        title: 'Marketing'
    },
    {
        id: 10,
        icon: FiCpu,
        title: 'Operations'
    },
    {
        id: 11,
        icon: MdFlip,
        title: 'Product & Design'
    },
    {
        id: 12,
        icon: PiCalculator,
        title: 'Quantitative Strategy'
    },
    {
        id: 13,
        icon: LuShieldCheck,
        title: 'Security'
    },
    {
        id: 14,
        icon: LuHeart,
        title: 'Talent Acquisition'
    },
    {
        id: 15,
        icon: TbMoodNerd,
        title: 'Human Resources'
    },
]
export const faqData = [
    {
        id: 1,
        title: 'What is Kyneto?',
        desc: 'Kyneto is a decentralized storage protocol built on top of IPFS, providing a persistent and incentivized layer for data storage.'
    },
    {
        id: 2,
        title: 'How does the Incentive Layer work?',
        desc: 'Providers pledge storage and stake KYN tokens. They are rewarded for providing proofs of storage and slashed if they fail to do so.'
    },
    {
        id: 3,
        title: 'Why choose Kyneto over Filecoin?',
        desc: 'Kyneto focuses on high-performance, verifiable storage with a more accessible provider stack and seamless IPFS integration.'
    },
    {
        id: 4,
        title: 'How do I become a provider?',
        desc: 'You can join the network by running the Kyneto Provider Daemon and pledging your available disk space.'
    },
    {
        id: 1,
        title: 'Why do I need to enter my email?',
        desc: 'There are many variations of passages of Lorem Ipsum available, but the majority have suffered alteration in some form.'
    },
    {
        id: 2,
        title: 'What is the 2-factor authentication?',
        desc: 'There are many variations of passages of Lorem Ipsum available, but the majority have suffered alteration in some form.'
    },
    {
        id: 3,
        title: ' What should I do if I lose a device with 2FA authentication?',
        desc: 'There are many variations of passages of Lorem Ipsum available, but the majority have suffered alteration in some form.'
    },
    {
        id: 4,
        title: ' What happens when I receive an order ?',
        desc: 'There are many variations of passages of Lorem Ipsum available, but the majority have suffered alteration in some form.'
    },
    {
        id: 1,
        title: 'What’s a wallet address?',
        desc: 'There are many variations of passages of Lorem Ipsum available, but the majority have suffered alteration in some form.'
    },
    {
        id: 2,
        title: 'How do I get a wallet address?',
        desc: 'There are many variations of passages of Lorem Ipsum available, but the majority have suffered alteration in some form.'
    },
    {
        id: 3,
        title: 'Whats the recipient’s address?',
        desc: 'There are many variations of passages of Lorem Ipsum available, but the majority have suffered alteration in some form.'
    },
    {
        id: 4,
        title: 'What is the maximal/minimal amount?',
        desc: 'There are many variations of passages of Lorem Ipsum available, but the majority have suffered alteration in some form.'
    },
    {
        id: 1,
        title: 'Which currencies are accepted for crypto-to-fiat transactions?',
        desc: 'There are many variations of passages of Lorem Ipsum available, but the majority have suffered alteration in some form.'
    },
    {
        id: 2,
        title: 'What limits are set for this transaction type?',
        desc: 'There are many variations of passages of Lorem Ipsum available, but the majority have suffered alteration in some form.'
    },
    {
        id: 3,
        title: ' What is SEPA bank transfer?',
        desc: 'There are many variations of passages of Lorem Ipsum available, but the majority have suffered alteration in some form.'
    },
    {
        id: 4,
        title: 'Which countries support crypto-to-fiat transactions?',
        desc: 'There are many variations of passages of Lorem Ipsum available, but the majority have suffered alteration in some form.'
    },
]
export const overviewData = [
    {
        icon: RiQuestionLine,
        title: 'FAQS',
        desc: 'We store the vast majority of the digital assets in secure offline storage.',
        link: '/help-faqs'
    },
    {
        icon: MdFlip,
        title: 'Guides / Support',
        desc: 'Cryptocurrency stored on our servers is covered by our insurance policy.',
        link: '/help-guides'
    },
    {
        icon: FiSettings,
        title: 'Support Request',
        desc: 'Kyneto supports a variety of the most popular digital currencies.',
        link: '/help-support'
    },
]

export const blogData = [
    {
        id: 1,
        image: blog1,
        title: 'Start The Redemption Before The ICO Completion',
        tag: 'ICO',
        date: '13th Sep 2023'
    },
    {
        id: 2,
        image: blog2,
        title: 'New Trends In UI/UX Design World Integration',
        tag: 'Bitcoin',
        date: '29th Nov 2023'
    },
    {
        id: 3,
        image: blog3,
        title: 'The Crypto Project Has Reached Seven Billions',
        tag: 'Cryptocurrency',
        date: '29th Dec 2023'
    },
    {
        id: 4,
        image: blog4,
        title: 'What is blockchain ?',
        tag: 'Cryptocurrency',
        date: '13th March 2023'
    },
    {
        id: 5,
        image: blog5,
        title: 'Top 10 cryptocurrency',
        tag: 'Crypto',
        date: '5th May 2023'
    },
    {
        id: 6,
        image: blog6,
        title: 'Trading Platform',
        tag: 'Trading',
        date: '19th June 2023'
    },
    {
        id: 7,
        image: blog7,
        title: 'The Crypto Project Has Reached Seven Billions',
        tag: 'Crypto',
        date: '20th June 2023'
    },
    {
        id: 8,
        image: blog8,
        title: 'New Trends In UI/UX Design World Integration',
        tag: 'Integration',
        date: '31st Aug 2023'
    },
]