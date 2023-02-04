import { React, useEffect, useState } from 'react';
import { styled } from '@mui/material/styles';
import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import CardContent from '@mui/material/CardContent';
import CardActions from '@mui/material/CardActions';
import Collapse from '@mui/material/Collapse';
import Typography from '@mui/material/Typography';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import DoneOutlineIcon from '@mui/icons-material/DoneOutline';
import ClearOutlinedIcon from '@mui/icons-material/ClearOutlined';
import { Box, IconButton, Button, Grid } from '@mui/material';
import LandListEntry from './minorComponents/LandListEntry';

// Blockchain imports
import { landBlockSalesReadable, LAND_BLOCK_SALES_ADDRESS, xcRMRKReadable, xcRMRKWritable } from '../components/smartContracts/MoonriverConfig';
import { ethers } from "ethers";
import { CHUNKY_LAND_IDS, GIFT_LAND_IDS } from './minorComponents/SkybreachTempData';
import GenericPopup from './minorComponents/GenericPopup/GenericPopup';
import { writeLandBlockSC } from './LandBlockSale';


const ExpandMore = styled((props) => {
    const { expand, ...other } = props;
    return <IconButton {...other} />;
})(({ theme, expand }) => ({
    transform: !expand ? 'rotate(0deg)' : 'rotate(180deg)',
    marginLeft: 'auto',
    transition: theme.transitions.create('transform', {
        duration: theme.transitions.duration.shortest,
    }),
}));

function OfferCard(props) {

    // Parent passed values
    const currentOfferId = props.id;
    const userWallet = props.userWallet;

    // Component state variables
    const [offerDetails, setOfferDetails] = useState(null);
    const [landIdsInOffer, setLandIdsInOffer] = useState([]);
    const [blockPrice, setBlockPrice] = useState(-1);
    const [serviceFee, setServiceFee] = useState("Loading");
    const [offerTimestamp, setOfferTimestamp] = useState(-1);
    const [isInitializedWithDetails, setIsInitializedWithDetails] = useState(false);
    const [offerMaker, setOfferMaker] = useState("Loading...");

    const [chunkyBlockPresence, setChunkyBlockPresence] = useState({});
    const [giftBlockPresence, setGiftBlockPresence] = useState({});
    const [chunkyBlockNumber, setChunkyBlockNumber] = useState(0);
    const [giftBoxesBlockNumber, setGiftBoxesBlockNumber] = useState(0);
    const [hasAdjacencyBonus, setHasAdjacencyBonus] = useState(false);

    // Interface animation state
    const [expanded, setExpanded] = useState(false);

    // Popups & Logs
    const [popupBuyOffer, setPopupBuyOffer] = useState(false);
    const [popupApproveBuy, setPopupApproveBuy] = useState(false);

    const handleExpandClick = () => {
        setExpanded(!expanded);
    };

    const closePopupBuyOffer = () => {
        setPopupBuyOffer(false);
    };
    const closePopupApproveBuy = () => {
        setPopupApproveBuy(false);
    };

    useEffect(() => {

        if (!isInitializedWithDetails) {
            // Get offer details on component creation
            landBlockSalesReadable.getOfferDetails(currentOfferId)
                .then(details => {
                    console.log("Dettagli reperiti: " + details);
                    setOfferDetails(details);
                    // Decoding offer data
                    if (offerDetails != null) {
                        console.log("Decoding offer deta...");
                        setLandIdsInOffer(decodeLandIdsFromCall(offerDetails['landIds']));
                        setBlockPrice(offerDetails['price']);
                        setServiceFee(offerDetails['serviceFee']);
                        setOfferTimestamp(offerDetails['timestamp']);
                        setOfferMaker(offerDetails['offerMaker']);
                        hadAdjacencyBonus()
                        setHasAdjacencyBonus(hasIt(landIdsInOffer));

                        // Get info about Othala Chunkies and Gift Boxes presence
                        setChunkyBlockPresence(getPresences(landIdsInOffer, CHUNKY_LAND_IDS));
                        setChunkyBlockNumber(getPresencesNumber(landIdsInOffer, chunkyBlockPresence));
                        setGiftBlockPresence(getPresences(landIdsInOffer, GIFT_LAND_IDS));
                        setGiftBoxesBlockNumber(getPresencesNumber(landIdsInOffer, giftBlockPresence));

                        // Stop refresh updating initialization
                        setIsInitializedWithDetails(true);
                    }
                })
                .catch(error => {
                    console.log("Error : " + error);
                });
        }
    });

    function approveXCRMRK(offerPrice) {
        console.log("Offer price: %f RMRK", offerPrice);
        xcRMRKWritable.approve(LAND_BLOCK_SALES_ADDRESS, offerPrice)
            .then(response => {
                console.log(response);
            }).catch(error => {
                console.log("Error approving XCRMRK");
                console.log(error);
                setPopupApproveBuy(false);
            });
        setPopupApproveBuy(false);
    }

    function buyLandBlock() {
        writeLandBlockSC.buyLandBlock(currentOfferId)
            .then(buyResponseResult => {
                console.log("buyResponseResult: " + buyResponseResult);
            })
            .catch(buyError => {
                console.log("Buy error: " + buyError);
            });
        setPopupBuyOffer(false);
    }


    return (
        <Card sx={{ mb: 3, maxWidth: 345, borderRadius: 3, boxShadow: 24, }}>
            <CardHeader className='blueGradient'
                title={"Offer ID: " + props.id} />

            <CardContent className='lightGreyGradient'>
                <Typography paragraph>
                    <Box fontWeight='fontWeightMedium' display='inline'> Price:</Box> {getRMRKBlockPrice(blockPrice)}
                </Typography>
                <Typography paragraph>
                    <Box fontWeight='fontWeightMedium' display='inline'> Total lands contained:</Box> {landIdsInOffer.length}
                </Typography>
                <Box display='inline-flex' alignItems='center'>
                    <Typography variant='body2' color="text.secondary" >
                        Lands list:
                    </Typography>
                    <ExpandMore
                        expand={expanded}
                        onClick={handleExpandClick}
                        aria-expanded={expanded}
                        aria-label="show more"
                    >
                        <ExpandMoreIcon />
                    </ExpandMore>
                </Box>

                {popupBuyOffer ?
                    <GenericPopup
                        handleOpen={popupBuyOffer}
                        handleClose={closePopupBuyOffer}
                        popupType="warning"
                        popupMessage={"Confirm that you want to deposit the "}
                        popupButtonMessage="Confirm declaration"
                        popupButtonAction={buyLandBlock} />
                    :
                    <></>
                }
                {popupApproveBuy ?
                    <GenericPopup
                        handleOpen={popupApproveBuy}
                        handleClose={closePopupApproveBuy}
                        popupType="warning"
                        popupMessage={"Confirm that you want to approve the smart contract to spend " + (parseFloat(blockPrice) / (10 ** 10)) + " RMRK to buy this land block"}
                        popupButtonMessage="Approve"
                        popupButtonAction={approveXCRMRK} />
                    :
                    <></>
                }

                <Collapse in={expanded} timeout="auto" >
                    {
                        landIdsInOffer.map((landId) => {
                            return (
                                <LandListEntry
                                    key={landId}
                                    id={landId}
                                    isOthalaChunkyPresent={chunkyBlockPresence[landId]}
                                    isGiftBoxPresent={giftBlockPresence[landId]}
                                />
                            );
                        })
                    }
                </Collapse>
            </CardContent>

            <CardActions className='blueGradient'>
                <Box sx={{ p: 1 }}>
                    <Typography >
                        <Box fontWeight='fontWeightMedium' display='inline'> Created by:&nbsp;</Box>
                    </Typography>
                    <Typography paragraph sx={{ fontSize: 12 }}>
                        {offerMaker}
                    </Typography>
                    <Typography paragraph>
                        <Box fontWeight='fontWeightMedium' display='inline'>  Creator fee:</Box> {serviceFee / 10}%
                    </Typography>
                    <Box display='flex' flexDirection='column'>
                        <Box display="inline-flex" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
                            <Typography sx={{ mr: 5 }}>
                                <Box fontWeight='fontWeightMedium' display='inline'> Gifts contained: </Box> {giftBoxesBlockNumber}
                            </Typography>
                            {getPresenceIcon(giftBoxesBlockNumber > 0)}
                        </Box>
                        <Box display="inline-flex" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
                            <Typography sx={{ mr: 5 }} noWrap>
                                <Box fontWeight='fontWeightMedium' display='inline'> Othala chunkies contained: </Box> {chunkyBlockNumber}
                            </Typography>
                            {getPresenceIcon(chunkyBlockNumber > 0)}
                        </Box>
                        <Box display="inline-flex" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
                            <Typography sx={{ mr: 5 }}>
                                <Box fontWeight='fontWeightMedium' display='inline'> Adjacency bonus:</Box> {hasIt(landIdsInOffer) ? "Yes" : "No"}
                            </Typography>
                            {getPresenceIcon(hasAdjacencyBonus)}
                        </Box>
                    </Box>
                    {userWallet === offerMaker ?
                        <Box display='flex' justifyContent='flex-end'>
                            <Button className='discardButton' variant='outlined' sx={{ mt: 2, fontWeight: 'bold', color: 'red', width: 100, borderRadius: 2 }}>
                                Cancel
                            </Button>
                        </Box> :


                        <Grid container direction='column' spacing={1} justifyContent='center'>
                            <Grid item xs='auto'>
                                <Button onClick={setPopupApproveBuy} className='yellowButton' variant='contained' size='small' sx={{ mt: 2, fontWeight: 'bold', color: '#282c34', width: 100 }} noWrap>
                                    Approve purchase
                                </Button>
                            </Grid>

                            <Grid item xs='auto'>
                                <Button onClick={setPopupBuyOffer} className='yellowButton' variant='contained' size='small' sx={{ fontWeight: 'bold', color: '#282c34', width: 100 }}>
                                    Buy
                                </Button>
                            </Grid>
                        </Grid>
                    }
                </Box>
            </CardActions>
        </Card >
    );
} export default OfferCard;


function decodeLandIdsFromCall(encodedIds) {
    var ids = [];
    for (let i = 0; i < encodedIds.length; i++) {
        ids.push(ethers.utils.formatEther(encodedIds[i]) * 10 ** 18);
    }
    return ids;
}

function getRMRKBlockPrice(landBlockPrice) {
    var price = landBlockPrice / 10 ** 10;
    return price + " RMRK";
}


function hasIt(landsOwned) {
    for (let i = 0; i < landsOwned.length; i++) {
        const x = landsOwned[i] % 256;
        const y = landsOwned[i] / 256;
        if (hadAdjacencyBonus(x, y, landsOwned)) {
            return true;
        }
    }
    return false;
}

function hadAdjacencyBonus(a, b, landsOwned) {
    const x = parseInt(a);
    const y = parseInt(b);
    for (let i = x - 1; i <= x + 1; i++) {
        for (let j = y - 1; j <= y + 1; j++) {
            const currentLand = i + j * 256;
            if (!landsOwned.includes(currentLand)) {
                return false;
            }
        }
    }
    return true;
}

function getPresences(ids, data) {

    const isPresent = {};
    for (let i = 0; i < ids.length; i++) {
        const landId = ids[i];
        isPresent[landId] = data.includes(landId);
    }
    return isPresent;
}

function getPresencesNumber(ids, presences) {
    var count = 0;
    for (let i = 0; i < ids.length; i++) {
        if (presences[ids[i]]) {
            count++;
        }
    }
    return count;
}

function getPresenceIcon(isPresent) {
    if (isPresent) {
        return (<DoneOutlineIcon sx={{ ml: 5 }} />);
    } else {
        return (<ClearOutlinedIcon sx={{ ml: 5 }} />);
    }
}