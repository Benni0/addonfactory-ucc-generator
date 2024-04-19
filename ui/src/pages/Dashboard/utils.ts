export const waitForElementToDisplay = (
    selector: string,
    selector2: string,
    callback: { (): void; (): void },
    checkFrequencyInMs: number | undefined,
    timeoutInMs: number
) => {
    const startTimeInMs = Date.now();
    const loopSearch = () => {
        if (document.querySelector(selector) && document.querySelector(selector2)) {
            callback();
        } else {
            setTimeout(() => {
                if (Date.now() - startTimeInMs > timeoutInMs) {
                    return;
                }
                loopSearch();
            }, checkFrequencyInMs);
        }
    };
    loopSearch();
};

/**
 * @param {string} elemSelector
 * @param {string} containerSelector
 */
export const waitForElementToDisplayAndMoveThemToCanvas = (
    elemSelector: string,
    containerSelector: string
) => {
    waitForElementToDisplay(
        elemSelector,
        containerSelector,
        () => {
            const element = document.querySelector(elemSelector);
            const container = document.querySelector(containerSelector);
            if (element) {
                container?.before(element);
            }
        },
        300,
        5000
    );
};

const queryMap: Record<string, string> = {
    'Source type': 'st',
    Source: 's',
    Host: 'h',
    Index: 'i',
    Account: 'event_account',
};

/**
 *
 * @param {string} searchValue value of search input
 * @param {boolean} hideToggleValue state of toggle input
 * @param {string} oldQuery current query
 * @param {string} selectedLabel current selected query type
 */
export const createNewQueryBasedOnSearchAndHideTraffic = (
    searchValue: string,
    hideToggleValue: unknown,
    oldQuery: string,
    selectedLabel: string
) => {
    const firstPipeIndex = oldQuery.indexOf('|');
    const part1 = oldQuery.substring(0, firstPipeIndex);
    const afterPart1 = oldQuery.substring(firstPipeIndex);

    const gbCalculationIndex = afterPart1.indexOf('GB=round');
    const beforeGbRoundPart = afterPart1.substring(0, gbCalculationIndex);

    const gbRoundAndAfter = afterPart1.substring(gbCalculationIndex);
    const firstPipeAfterGbRound = gbRoundAndAfter.indexOf('|');
    const gbRoundPipe = gbRoundAndAfter.substring(0, firstPipeAfterGbRound);
    const afterGbRoundipe = gbRoundAndAfter.substring(firstPipeAfterGbRound);

    const searchQuery = searchValue ? `${queryMap[selectedLabel] || 'st'}=*${searchValue}* ` : '';

    const hideNoTrafficQuery = hideToggleValue ? '| where GB>0 ' : '';

    const newQuery = `${part1}${searchQuery}${beforeGbRoundPart}${gbRoundPipe}${hideNoTrafficQuery}${afterGbRoundipe}`;
    return newQuery;
};