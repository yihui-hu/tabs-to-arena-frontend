import { useState } from "react";
import {
  Input,
  Typography,
  Button,
  Space,
  ConfigProvider,
  Image,
  Select,
  Row,
  Col,
} from "antd";
import { EyeInvisibleOutlined, EyeTwoTone } from "@ant-design/icons";
import Arena from "are.na";
import axios from "axios";
import type { SelectProps } from "antd";
import useMediaQuery from "./hooks/useMediaQuery";
const { TextArea } = Input;
const { Title, Text, Link } = Typography;

const arena = new Arena();

const arrayBufferToBase64 = (buffer: any) => {
  var binary = "";
  var bytes = new Uint8Array(buffer);
  var len = bytes.byteLength;
  for (var i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
};

const filterOption = (
  input: string,
  option: { label: string; value: string }
) => (option?.label ?? "").toLowerCase().includes(input.toLowerCase());

export default function App() {
  const [URLs, setURLs] = useState<string>("");
  const [processedURLs, setProcessedURLs] = useState<string[]>([]);
  const [username, setUsername] = useState<string>("");
  const [userData, setUserData] = useState(undefined);
  const [channels, setChannels] = useState<SelectProps["options"] | undefined>(
    undefined
  );
  const [token, setToken] = useState<string>("");
  const [authToken, setAuthToken] = useState<string>("");
  const [results, setResults] = useState<any[]>([]);
  
  const isMobile = useMediaQuery("(max-width: 1024px)");

  const searchUser = async () => {
    const response = await arena.user(username).get();

    const created_at = new Date(response.created_at);
    const created_at_formatted = created_at.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const userData = {
      id: response.id,
      first_name: response.first_name,
      last_name: response.last_name,
      avatar_image: response.avatar_image,
      badge: response.badge,
      channel_count: response.channel_count,
      created_at: created_at_formatted,
    };

    setUserData(userData);
  };

  const uploadToken = async () => {
    const arena_w_token = new Arena({ accessToken: token });
    const response = await arena_w_token
      .user(userData?.id)
      .channels({ page: 1, per: 1000 });
    const channels = response.map((channel) => {
      return {
        label: channel.title,
        value: channel.id,
      };
    });
    setChannels(channels);
  };

  const processBatch = async (urls: string[]) => {
    try {
      const response = await axios.post(
        "http://localhost:3000/api/screenshot",
        { urls: urls },
        {
          headers: {
            "Content-Type": "application/json;charset=UTF-8",
            "Access-Control-Allow-Origin": "*",
          },
        }
      );

      // const promises = urls.map(async (url) => {
      //   const response = await axios.post(
      //     "http://localhost:3000/api/screenshot",
      //     { url: url },
      //     {
      //       headers: {
      //         "Content-Type": "application/json;charset=UTF-8",
      //         "Access-Control-Allow-Origin": "*",
      //       },
      //     }
      //   );
      //   return response.data;
      // });

      // const results = await Promise.allSettled(promises);

      // const processedResults = results.map((result) => {
      //   if (result.status === "fulfilled") {
      //     const imgSrc = arrayBufferToBase64(result.value.screenshot.data);

      //     return {
      //       title:
      //         result.value.title === undefined || result.value.title === ""
      //           ? "Untitled"
      //           : result.value.title,
      //       screenshot: `data:image/png;base64,${imgSrc}`,
      //     };
      //     // @TODO: Handle errors better
      //   } else {
      //     const imgSrc = "https://via.placeholder.com/300x150";

      //     return {
      //       title: "Error",
      //       screenshot: imgSrc,
      //     };
      //   }
      // });

      const processedResults = response.data.map((result: any) => {
        const imgSrc = arrayBufferToBase64(result.screenshot.data);

        return {
          title:
            result.title === undefined || result.title === ""
              ? "Untitled"
              : result.title,
          screenshot: `data:image/png;base64,${imgSrc}`,
        };
      });

      return processedResults;
    } catch (error) {
      console.error("Error in processBatch:", error);
    }
  };

  const processURLs = async () => {
    const urls = URLs.split("\n");
    setProcessedURLs(urls);

    const batches = [];
    for (let i = 0; i < urls.length; i += 5) {
      batches.push(urls.slice(i, i + 5));
    }

    for (const batch of batches) {
      const batchResults = await processBatch(batch);
      setResults((prev) => prev.concat(batchResults));
    }
  };

  return (
    <ConfigProvider
      theme={{
        token: {
          // Seed Token
          colorPrimary: "#2A2A2A",
          borderRadius: 4,

          // Alias Token
          colorBgContainer: "#FFFFFF",
        },
      }}
    >
      <Space
        direction="vertical"
        style={{ padding: 14, width: isMobile ? "100%" : "40%" }}
        size="middle"
      >
        <Title level={5}>Are.na Username</Title>
        <Space.Compact direction="horizontal" block>
          <Input
            addonBefore="https://are.na/"
            placeholder="your-name"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          {username.length > 0 && (
            <Button type="primary" onClick={searchUser}>
              Search
            </Button>
          )}
        </Space.Compact>
        {userData && (
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              gap: 16,
              alignItems: "center",
            }}
          >
            <Image src={userData.avatar_image?.thumb} preview={false} />
            <span>{userData.first_name}</span>
            <span style={{ textTransform: "capitalize" }}>
              {userData.badge}
            </span>
            <span>{userData.channel_count} channels</span>
            <span>Created: {userData.created_at}</span>
          </div>
        )}
        {userData && (
          <>
            <Title level={5}>Are.na Token</Title>
            <Space.Compact direction="horizontal" block>
              <Input.Password
                maxLength={43}
                placeholder="43 characters, including hyphens"
                allowClear
                iconRender={(visible) =>
                  visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />
                }
                onChange={(e) => setToken(e.target.value)}
              />
              {token.length === 43 && (
                <Button type="primary" onClick={() => uploadToken()}>
                  Set token
                </Button>
              )}
            </Space.Compact>{" "}
          </>
        )}
        {channels && (
          <>
            <Title level={5}>URLs</Title>
            <TextArea
              placeholder={`https://google.com\nhttps://facebook.com\nhttps://twitter.com`}
              autoSize={{ minRows: 3, maxRows: 18 }}
              onChange={(e) => setURLs(e.target.value)}
            />
            <Button type="primary" onClick={() => processURLs()}>
              Process
            </Button>
          </>
        )}
        {results.length > 0 && (
          <>
            <Title level={5}>Connect URLs to channels</Title>
            <Row gutter={[16, 16]} style={{ width: "calc(100vw - 14px)" }}>
              {results.map((result, index) => {
                return (
                  <Col span={8}>
                    <Space direction="vertical">
                      <Image src={result.screenshot} />
                      <Text strong>{result.title}</Text>
                      <Link href={processedURLs[index]} target="_blank">
                        {processedURLs[index]}
                      </Link>
                      <Select
                        mode="multiple"
                        allowClear
                        placeholder="Select channels to add to"
                        style={{ width: "100%" }}
                        options={channels}
                        filterOption={filterOption}
                      />
                    </Space>
                  </Col>
                );
              })}
            </Row>
          </>
        )}
      </Space>
    </ConfigProvider>
  );
}
