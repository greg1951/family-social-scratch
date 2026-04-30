import {
  Html,
  Head,
  Body,
  Container,
  Text,
  Button,
  Tailwind,
  Img,
  Section,
  Row,
  Column,
} from '@react-email/components';

const emailTailwindConfig = {
  theme: {
    extend: {
      fontFamily: {
        app: ['Merienda', 'Roboto', 'sans-serif'],
      },
      colors: {
        brandBg: '#eff6ff',
        brandPanel: '#ffffff',
        brandBorder: '#93c5fd',
        brandText: '#1e3a8a',
        brandButton: '#1d4ed8',
        imageBg: '#59CDF7'
      },
    },
  },
};

export const MemberInviteEmail = ({ memberName, founderName, familyName, link }
  : { memberName: string, founderName: string, familyName: string, link: string }) => (
  <Html>
    <Head />
    <Tailwind config={ emailTailwindConfig }>
      <Body className='bg-brandBg py-10 text-brandText font-app'>
        <Container style={ { padding: '20px' } } className='mx-auto rounded-lg border border-brandBorder bg-brandPanel px-8 py-6'>
          <Section className='mb-4'>
            <Row>
              <Column align='left' valign='middle' style={ { width: '800px' } }>
                <Text className='m-0 font-app text-base leading-6'>
                  Good News, { memberName }! You have been invited by 👉{ founderName }👈 to join the &quot;{ familyName }&quot; on the Family Social website.
                </Text>
              </Column>
            </Row>
          </Section>
          <Section style={ { width: '700px' } }>
            <Row>
              <Column align='left' valign='top' style={ { width: '620px', paddingRight: '20px' } }>
                <Text className='m-0 font-app text-base leading-6'>
                  What is Family Social you ask? It is a site dedicated to helping families stay connected and share family news, photos, movie and TV reviews,
                  exchange food recipes, and more in a private and secure environment.
                </Text>
                <Text className='m-0 font-app text-base leading-6 pt-2'>
                  You have questions? We have answers! Check out our <a href="https://kbgfamilysocial.com/faq" className='text-brandButton'>FAQ</a> page to learn more about Family Social and how it can help your family stay connected and share special moments together.
                </Text>
              </Column>
              <Column align='center' valign='middle' style={ { width: '180px', paddingTop: '8px' } }>
                <Text className='m-0 text-center'>
                  <Button
                    href="https://kbgfamilysocial.com"
                    className='font-app inline-block rounded-full bg-brandButton px-5 py-3 font-extrabold text-white no-underline'
                  >
                    Visit Family Social
                  </Button>
                </Text>
              </Column>
            </Row>
          </Section>
          <Section style={ { width: '700px' } }>
            <Row>
              <Column align='left' valign='top'>
                <Text className='m-0 mb-4 pt-2 text-left font-app text-base leading-6'>
                  We would be thrilled for you to join us and can&apos;t wait for you to experience all the wonderful features we have to offer:
                  <i>TV Junkies, Movie Maniacs, Music Lovers, Family Foodies, Book Besties, Poetry Cafe, Family Game Scoreboard</i>, and more!
                </Text>
                <Text className='m-0 mb-4 pt-2 text-left font-app text-base font-semibold leading-6 text-brandText'>
                  To get started, click on the <b>Register in Family Social</b> button below to register in the &quot;{ familyName }&quot; family network.
                </Text>
                <Text className='m-0 mb-4 pt-2 text-center font-app text-base leading-6 text-brandText'>
                  (The button below is valid for <b>seven days</b>, so check us out! 😁)
                </Text>
              </Column>
            </Row>
          </Section>
          <Section style={ { width: '700px' } }>
            <Row>
              <Column align='center'>
                <Button
                  href={ link }
                  className='font-app inline-block rounded-full bg-brandButton px-5 py-3 font-extrabold text-white no-underline'
                >
                  Register in Family Social
                </Button>
              </Column>
            </Row>
          </Section>
        </Container>
      </Body>
    </Tailwind >
  </Html >
);

export default MemberInviteEmail;
