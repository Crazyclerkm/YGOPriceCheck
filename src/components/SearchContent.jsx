import { Box } from "@mui/material";
import Card from '@mui/material/Card';
import CardActionArea from '@mui/material/CardActionArea';
import CardContent from '@mui/material/CardContent';
import CardMedia from '@mui/material/CardMedia';
import Typography from '@mui/material/Typography';
import { useRef, useState, useEffect, useCallback } from "react";

function SearchContent({searchQuery, sortOption}) {
    return(
        <SearchDisplay 
            searchQuery={searchQuery}
            sortOption={sortOption}
            key={`${searchQuery}-${sortOption}`}
        />
    );
}

function SearchDisplay({searchQuery, sortOption}) {
    const [results, setResults] = useState([]);
    const [pageIndex, setPageIndex] = useState(0);
    const [loading, setLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const observer = useRef();

    const lastCardRef = useCallback(
        (node) => {
            if (loading || !hasMore ) return;
            if(observer.current) observer.current.disconnect();

            observer.current = new IntersectionObserver((entries) => {
                if(entries[0].isIntersecting) {
                    setPageIndex(prev => prev + 1);
                }
            });

            if (node) observer.current.observe(node);
        }, [loading, hasMore]);    

    async function loadMoreResults() {
        if (loading || !hasMore) return;
        
        setLoading(true);
        const newResults = await fetchResults(searchQuery, pageIndex);
        setResults(prev => [...prev, ...newResults]);
        setLoading(false);
    };

    useEffect(() => {
        loadMoreResults();
    }, [pageIndex]);

    async function fetchResults(query, index, count=16) {
        try {
            let response = null;
            if(query !== '') {
                response = await fetch(`./search.php?name=${query}&index=${index}&count=${count}`, {credentials: 'include'});
            } else {
                response = await fetch(`./search.php?index=${index}&count=${count}` , {credentials: 'include'});
            }

            const data = await response.json();

            if (data.length < count) {
                setHasMore(false);
            }

            return data;
        } catch (error) {
            console.error('Fetch error: ', error);
            return [];
        }
    };

    return (
        <Box 
            sx={{
                pt: '6em', 
                width: '75%',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(min(300px, 100%), 1fr))',
                gap: 2,
                margin: 'auto'
            }}
        >
            {Array.isArray(results) && results.map((result, index) => (
                <Card 
                    key={`${result.vendor}-${result.variant_id}-${index}`}
                    ref={(results.length === index + 1) ? lastCardRef : null}
                >
                    <CardActionArea
                        component="a"
                        href= {`${result.vendor}'/products/'${result.handle}}`}
                        target="_blank"
                    >
                        <CardContent>
                            <CardMedia
                                component="img"
                                sx={{ width: 151, margin: 'auto' }}
                                image={result.img_src}
                                alt={`${result.name} card image`}
                            />
                            <Typography component="div" variant="h5">
                                {result.name}
                            </Typography>
                            <Typography component="div" variant="subtitle1">
                                {`${result.variant_title} | ${result.vendor}`}
                            </Typography>
                            <Typography component="div" variant="subtitle1">
                                {`\$${result.price}`}
                            </Typography>
                        </CardContent>
                    </CardActionArea>
                </Card>
            ))}
            {loading && <p>Loading...</p>}
        </Box>
    );
}

export default SearchContent;