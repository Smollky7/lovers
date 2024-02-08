"use strict";

var UserStatus;
(function (UserStatus) {
    UserStatus["LoggedIn"] = "Logged In";
    UserStatus["LoggingIn"] = "Logging In";
    UserStatus["LoggedOut"] = "Logged Out";
    UserStatus["LogInError"] = "Log In Error";
    UserStatus["VerifyingLogIn"] = "Verifying Log In";
})(UserStatus || (UserStatus = {}));

var Default;
(function (Default) {
    Default["PIN"] = "1905";
})(Default || (Default = {}));

var WeatherType;
(function (WeatherType) {
    WeatherType["Cloudy"] = "Cloudy";
    WeatherType["Rainy"] = "Rainy";
    WeatherType["Stormy"] = "Stormy";
    WeatherType["Sunny"] = "Sunny";
})(WeatherType || (WeatherType = {}));

const defaultPosition = () => ({
    left: 0,
    x: 0
});

const N = {
    clamp: (min, value, max) => Math.min(Math.max(min, value), max),
    rand: (min, max) => Math.floor(Math.random() * (max - min + 1) + min)
};

const T = {
    format: (date) => {
        const hours = date.getHours(), minutes = date.getMinutes(), seconds = date.getSeconds();
        return `${hours}:${T.formatSegment(minutes)}`;
    },
    formatHours: (hours) => {
        return hours % 12 === 0 ? 12 : hours % 12;
    },
    formatSegment: (segment) => {
        return segment < 10 ? `0${segment}` : segment;
    }
};

const LogInUtility = {
    verify: async (pin) => {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                if (pin === Default.PIN) {
                    resolve(true);
                }
                else {
                    reject(`Pin inválido: ${pin}`);
                }
            }, N.rand(300, 700));
        });
    }
};

const useCurrentDateEffect = () => {
    const [date, setDate] = React.useState(new Date());
    React.useEffect(() => {
        const interval = setInterval(() => {
            const update = new Date();
            if (update.getSeconds() !== date.getSeconds()) {
                setDate(update);
            }
        }, 100);
        return () => clearInterval(interval);
    }, [date]);
    return date;
};

const ScrollableComponent = (props) => {
    const ref = React.useRef(null);
    const [state, setStateTo] = React.useState({
        grabbing: false,
        position: defaultPosition()
    });

    const handleOnMouseDown = (e) => {
        setStateTo(Object.assign(Object.assign({}, state), { grabbing: true, position: {
                x: e.clientX,
                left: ref.current.scrollLeft
            } }));
    };

    const handleOnMouseMove = (e) => {
        if (state.grabbing) {
            const left = Math.max(0, state.position.left + (state.position.x - e.clientX));
            ref.current.scrollLeft = left;
        }
    };

    const handleOnMouseUp = () => {
        if (state.grabbing) {
            setStateTo(Object.assign(Object.assign({}, state), { grabbing: false }));
        }
    };

    return (React.createElement("div", { ref: ref, className: classNames("scrollable-component", props.className), id: props.id, onMouseDown: handleOnMouseDown, onMouseMove: handleOnMouseMove, onMouseUp: handleOnMouseUp, onMouseLeave: handleOnMouseUp }, props.children));
};

const Reminder = () => {
    return (React.createElement("div", { className: "reminder" }));
};

const Time = () => {
    const date = useCurrentDateEffect();
    return (React.createElement("span", { className: "time" }, T.format(date)));
};

const Info = (props) => {
    const date = useCurrentDateEffect();
    const calculateMonthsSince = (date) => {
        const referenceDate = new Date("2023-05-19");
        let monthsSince = (date.getFullYear() - referenceDate.getFullYear()) * 11 + (date.getMonth() - referenceDate.getMonth());
        let yearsSince = Math.floor(monthsSince / 12);
        if (date.getDate() >= 19) {
            monthsSince += 1;
        }
        monthsSince = monthsSince > 11 ? monthsSince - 11 : monthsSince; // Ajuste para limitar meses a 12
        return { monthsSince, yearsSince };
    };

    const { monthsSince, yearsSince } = calculateMonthsSince(date);

    const formatMonthsAndYearsText = (months, years) => {
        const monthsText = months === 1 ? "mês" : "meses"; // Corrigido para verificar corretamente se é 1 mês
        if (years > 0) {
            const yearsText = years === 1 ? "ano" : "anos"; // Corrigido para verificar corretamente se é 1 ano
            return `${months} ${monthsText} e ${years} ${yearsText}`;
        } else {
            return `${months} ${monthsText}`;
        }
    };
    

    return (
        React.createElement("div", { id: props.id, className: "info" },
            React.createElement(Time, null),
            React.createElement("span", { className: "months-since" }, `São ${formatMonthsAndYearsText(monthsSince, yearsSince)}.`))
    );
};


const PinDigit = (props) => {
    const [hidden, setHiddenTo] = React.useState(false);
    React.useEffect(() => {
        if (props.value) {
            const timeout = setTimeout(() => {
                setHiddenTo(true);
            }, 500);
            return () => {
                setHiddenTo(false);
                clearTimeout(timeout);
            };
        }
    }, [props.value]);
    return (React.createElement("div", { className: classNames("app-pin-digit", { focused: props.focused, hidden }) },
        React.createElement("span", { className: "app-pin-digit-value" }, props.value || "")));
};

const Pin = () => {
    const { userStatus, setUserStatusTo } = React.useContext(AppContext);
    const [pin, setPinTo] = React.useState("");
    const ref = React.useRef(null);
    
    React.useEffect(() => {
        if (userStatus === UserStatus.LoggingIn || userStatus === UserStatus.LogInError) {
            ref.current.focus();
        }
        else {
            setPinTo("");
        }
    }, [userStatus]);

    React.useEffect(() => {
        if (pin.length === 4) {
            const verify = async () => {
                try {
                    setUserStatusTo(UserStatus.VerifyingLogIn);
                    if (await LogInUtility.verify(pin)) {
                        setUserStatusTo(UserStatus.LoggedIn);
                    }
                }
                catch (err) {
                    console.error(err);
                    setUserStatusTo(UserStatus.LogInError);
                }
            };
            verify();
        }
        if (userStatus === UserStatus.LogInError) {
            setUserStatusTo(UserStatus.LoggingIn);
        }
    }, [pin]);

    const handleOnClick = () => {
        ref.current.focus();
    };

    const handleOnCancel = () => {
        setUserStatusTo(UserStatus.LoggedOut);
    };

    const handleOnChange = (e) => {
        if (e.target.value.length <= 4) {
            setPinTo(e.target.value.toString());
        }
    };

    const getCancelText = () => {
        return (
            React.createElement("span", { id: "app-pin-cancel-text", onClick: handleOnCancel }, "Cancel")
        );
    };

    const getErrorText = () => {
        if (userStatus === UserStatus.LogInError) {
            return (
                React.createElement("span", { id: "app-pin-error-text" }, "Invalid")
            );
        }
    };

    return (
        React.createElement("div", { id: "app-pin-wrapper" },
            React.createElement("input", { disabled: userStatus !== UserStatus.LoggingIn && userStatus !== UserStatus.LogInError, id: "app-pin-hidden-input", maxLength: 4, ref: ref, type: "number", value: pin, onChange: handleOnChange }),
            React.createElement("div", { id: "app-pin", onClick: handleOnClick },
                React.createElement(PinDigit, { focused: pin.length === 0, value: pin[0] }),
                React.createElement(PinDigit, { focused: pin.length === 1, value: pin[1] }),
                React.createElement(PinDigit, { focused: pin.length === 2, value: pin[2] }),
                React.createElement(PinDigit, { focused: pin.length === 3, value: pin[3] })),
            React.createElement("h3", { id: "app-pin-label" },
                "Enter PIN ",
                getErrorText(),
                " ",
                getCancelText())
        )
    );
};

const MenuSection = (props) => {
    const getContent = () => {
        if (props.scrollable) {
            return (
                React.createElement(ScrollableComponent, { className: "menu-section-content" }, props.children)
            );
        }
        return (
            React.createElement("div", { className: "menu-section-content" }, props.children)
        );
    };
    return (
        React.createElement("div", { id: props.id, className: "menu-section" },
            React.createElement("div", { className: "menu-section-title" },
                React.createElement("i", { className: props.icon }),
                React.createElement("span", { className: "menu-section-title-text" }, props.title)),
            getContent())
    );
};

const Restaurants = () => {
    const getRestaurants = () => {
        return [{
            desc: "Presente",
            id: 1,
            image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRsUF0M1BR0RxZtaFSoAOLMqIzfN6NCp1aT30vp2ykhNA&s",
            title: "Dia dos namorados",
            link: "https://www.example.com/restaurante1"
        }, {
            desc: "Filmes das nossas vidas",
            id: 2,
            image: "https://files.tecnoblog.net/wp-content/uploads/2021/12/melhor-streaming-2021-netflix-1-700x394.jpg",
            title: "Netflix",
            link: "https://www.example.com/restaurante2"
        }].map((restaurant) => {
            const styles = {
                backgroundImage: `url(${restaurant.image})`
            };
            return (
                React.createElement("div", { key: restaurant.id, className: "restaurant-card background-image restaurant-link", style: styles},
                    React.createElement("div", { className: "restaurant-card-content" },
                        React.createElement("div", { className: "restaurant-card-content-items" },
                            React.createElement("a", { href: restaurant.link, className: "restaurant-link" },
                                React.createElement("span", { className: "restaurant-card-title" }, restaurant.title)
                            ),
                            React.createElement("span", { className: "restaurant-card-desc" }, restaurant.desc)
                        )
                    )
                )
            );
        });
    };
    return (
        React.createElement(MenuSection, { icon: "fa-regular fa-code", id: "restaurants-section", title: "Aplicativos" },
            getRestaurants()
        )
    );
};

const UserStatusButton = (props) => {
    const { userStatus, setUserStatusTo } = React.useContext(AppContext);
    const handleOnClick = () => {
        setUserStatusTo(props.userStatus);
    };
    return (
        React.createElement("button", { id: props.id, className: "user-status-button clear-button", disabled: userStatus === props.userStatus, type: "button", onClick: handleOnClick },
            React.createElement("i", { className: props.icon }))
    );
};

const Menu = () => {
    return (
        React.createElement("div", { id: "app-menu" },
            React.createElement("div", { id: "app-menu-content-wrapper" },
                React.createElement("div", { id: "app-menu-content" },
                    React.createElement("div", { id: "app-menu-content-header" },
                        React.createElement("div", { className: "app-menu-content-header-section" },
                            React.createElement(Info, { id: "app-menu-info" }),
                            React.createElement(Reminder, null)),
                        React.createElement("div", { className: "app-menu-content-header-section" },
                            React.createElement(UserStatusButton, { icon: "fa-solid fa-arrow-right-from-arc", id: "sign-out-button", userStatus: UserStatus.LoggedOut }))),
                    React.createElement(Restaurants, null),
                ))));
};

const Background = () => {
    const { userStatus, setUserStatusTo } = React.useContext(AppContext);
    const handleOnClick = () => {
        if (userStatus === UserStatus.LoggedOut) {
            setUserStatusTo(UserStatus.LoggingIn);
        }
    };
    return (
        React.createElement("div", { id: "app-background", onClick: handleOnClick },
            React.createElement("div", { id: "app-background-image", className: "background-image" }))
    );
};

const Loading = () => {
    return (
        React.createElement("div", { id: "app-loading-icon" },
            React.createElement("i", { className: "fa-solid fa-spinner-third" }))
    );
};

const AppContext = React.createContext(null);

const App = () => {
    const [userStatus, setUserStatusTo] = React.useState(UserStatus.LoggedOut);

    const getStatusClass = () => {
        return userStatus.replace(/\s+/g, "-").toLowerCase();
    };

    return (
        React.createElement(AppContext.Provider, { value: { userStatus, setUserStatusTo } },
            React.createElement("div", { id: "app", className: getStatusClass() },
                React.createElement(Info, { id: "app-info" }),
                React.createElement(Pin, null),
                React.createElement(Menu, null),
                React.createElement(Background, null),
                React.createElement("div", { id: "sign-in-button-wrapper" },
                    React.createElement(UserStatusButton, { icon: "fa-solid fa-arrow-right-to-arc", id: "sign-in-button", userStatus: UserStatus.LoggingIn })),
                React.createElement(Loading, null))))

};

ReactDOM.render(React.createElement(App, null), document.getElementById("root"));
