import { useState, useEffect } from "react";
import {
  Box,
  Button,
  TextField,
  Card,
  CardContent,
  Typography,
  Container,
  Avatar,
  Stack,
} from "@mui/material";

// pokeAPI のエンドポイント
const POKE_API_ENDPOINT = "https://pokeapi.co/api/v2/pokemon";

export default function Home() {
  // 検索用
  const [searchId, setSearchId] = useState("");
  // 候補エリアに表示するデータ (ID, 画像)
  const [candidate, setCandidate] = useState(null);

  // localStorage にある "pokemons" の ID一覧を管理
  const [pokemonIds, setPokemonIds] = useState([]);

  // カード表示用データの配列
  // [{ id, name, imageUrl, speed, isSDisplayed }, ...] のような形で格納
  const [cardData, setCardData] = useState([]);

  // -- 初期表示処理 --
  useEffect(() => {
    // 画面初期読み込み時に localStorage から pokemons を取得し、state に格納
    if (typeof window !== "undefined") {
      const storedPokemons = localStorage.getItem("pokemons");
      if (storedPokemons) {
        setPokemonIds(JSON.parse(storedPokemons));
      }
    }
  }, []);

  // pokemonIds が変わるたびに PokeAPI から詳細を再取得して cardData を更新
  useEffect(() => {
    if (pokemonIds.length === 0) {
      setCardData([]);
      return;
    }

    // ID リストをもとに全部まとめて fetch し、cardData を作り直す
    const fetchAllPokemons = async () => {
      const newCardData = [];
      for (const pId of pokemonIds) {
        const url = `${POKE_API_ENDPOINT}/${pId}`;
        try {
          const res = await fetch(url);
          if (!res.ok) {
            // 404 等の場合、無視
            continue;
          }
          const data = await res.json();
          const speedStat = data.stats[5]?.base_stat; // stats[5] = speed という想定
          newCardData.push({
            id: data.id,
            name: data.name,
            imageUrl: data.sprites?.front_default || "",
            speed: speedStat,
            // 初期は表示するかどうかは任意、例では非表示にしてみる
            isSDisplayed: false,
          });
        } catch (error) {
          console.error("Failed to fetch data for ID:", pId, error);
        }
      }
      setCardData(newCardData);
    };

    fetchAllPokemons();
  }, [pokemonIds]);

  // --- ID 検索処理（完全一致） ---
  const handleSearch = async () => {
    if (!searchId) return;
    try {
      const res = await fetch(`${POKE_API_ENDPOINT}/${searchId.toLowerCase()}`);
      if (!res.ok) {
        // 見つからないなどエラー時は候補エリアをクリア
        setCandidate(null);
        alert("該当するポケモンが見つかりませんでした。");
        return;
      }
      const data = await res.json();
      // 候補エリアには ID とアイコンだけ表示
      const candidateData = {
        id: data.id,
        imageUrl: data.sprites.front_default,
      };
      setCandidate(candidateData);
    } catch (error) {
      console.error("Failed to search:", error);
      setCandidate(null);
    }
  };

  // --- 候補エリア「追加」ボタン ---
  const handleAdd = () => {
    if (!candidate) return;
    const newId = candidate.id;
    // すでに追加済みの場合は何もしない例
    if (pokemonIds.includes(newId)) {
      alert("すでに追加されています。");
      setCandidate(null);
      return;
    }
    const updated = [...pokemonIds, newId];
    setPokemonIds(updated);
    // localStorage へ保存
    if (typeof window !== "undefined") {
      localStorage.setItem("pokemons", JSON.stringify(updated));
    }
    // 候補エリアをクリア (エリアの高さは残して見た目だけクリア)
    setCandidate(null);
    setSearchId("");
  };

  // --- Card の「削除」ボタン ---
  const handleDelete = (id) => {
    const updated = pokemonIds.filter((pId) => pId !== id);
    setPokemonIds(updated);
    if (typeof window !== "undefined") {
      localStorage.setItem("pokemons", JSON.stringify(updated));
    }
  };

  // --- 全カードの S 表示 ---
  const handleShowAll = () => {
    setCardData((prev) =>
      prev.map((card) => ({
        ...card,
        isSDisplayed: true,
      }))
    );
  };

  // --- 全カードの S 非表示 ---
  const handleHideAll = () => {
    setCardData((prev) =>
      prev.map((card) => ({
        ...card,
        isSDisplayed: false,
      }))
    );
  };

  // --- 個別に S 表示/非表示 をトグル ---
  const handleToggleS = (id) => {
    setCardData((prev) =>
      prev.map((card) => {
        if (card.id === id) {
          return {
            ...card,
            isSDisplayed: !card.isSDisplayed,
          };
        }
        return card;
      })
    );
  };

  return (
    <Container maxWidth="sm" sx={{ py: 2 }}>
      {/* 検索エリア */}
      <Box
        sx={{
          height: 50,
          display: "flex",
          alignItems: "center",
          p: 1,
          mb: 2,
        }}
      >
        <TextField
          label="ID"
          variant="outlined"
          size="small"
          value={searchId}
          onChange={(e) => setSearchId(e.target.value)}
          sx={{ mr: 1, width: "100px" }}
        />
        <Button variant="contained" onClick={handleSearch}>
          検索
        </Button>
      </Box>

      {/* 候補エリア */}
      <Box
        sx={{
          height: 50,
          display: "flex",
          alignItems: "center",
          p: 1,
          mb: 2,
        }}
      >
        {candidate ? (
          <Stack direction="row" spacing={2} alignItems="center">
            <Typography>ID: {candidate.id}</Typography>
            {candidate.imageUrl && (
              <Avatar
                alt={`pokemon-${candidate.id}`}
                src={candidate.imageUrl}
                sx={{ width: 32, height: 32 }}
              />
            )}
            <Button variant="contained" onClick={handleAdd}>
              追加
            </Button>
          </Stack>
        ) : (
          // 候補がないとき、空の高さを保つ
          <Typography color="text.secondary">候補なし</Typography>
        )}
      </Box>

      {/* 操作エリア */}
      <Box sx={{ mb: 2, display: "flex", gap: 1 }}>
        <Button variant="contained" onClick={handleShowAll}>
          表示
        </Button>
        <Button variant="contained" onClick={handleHideAll}>
          非表示
        </Button>
      </Box>

      {/* Card エリア */}
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {cardData.map((card) => (
          <Card key={card.id} sx={{ display: "flex", alignItems: "center" }}>
            <CardContent sx={{ flex: 1 }}>
              <Stack direction="row" spacing={2} alignItems="center">
                <Typography>ID: {card.id}</Typography>
                {card.imageUrl && (
                  <Avatar
                    alt={card.name}
                    src={card.imageUrl}
                    sx={{ width: 56, height: 56 }}
                  />
                )}
                {/* Sの表示/非表示をクリックでトグル */}
                <Typography
                  variant="body1"
                  sx={{ cursor: "pointer" }}
                  onClick={() => handleToggleS(card.id)}
                >
                  {card.isSDisplayed ? card.speed : "-"}
                </Typography>
              </Stack>
            </CardContent>
            <Box sx={{ p: 1 }}>
              <Button
                variant="outlined"
                color="error"
                onClick={() => handleDelete(card.id)}
              >
                削除
              </Button>
            </Box>
          </Card>
        ))}
      </Box>
    </Container>
  );
}
